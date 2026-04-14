/* ============================================
   CSV / Excel Upload & Parse System
   ============================================ */

import { normalizeDate, normalizeAmount, el, icon, escHtml } from './utils.js';
import { showToast, showModal } from './ui.js';
import { detectDuplicates, showDuplicateResolutionModal } from './duplicates.js';
import { insertEntries } from './supabase.js';
import { store } from './store.js';

// Column aliases for auto-mapping
const COLUMN_MAP = {
  date: ['date', 'transaction date', 'trans date', 'txn date', 'posting date', 'value date'],
  business: ['business', 'company', 'entity', 'merchant', 'vendor', 'biz'],
  account: ['account', 'bank', 'bank account', 'acct'],
  type: ['type', 'type category', 'transaction type', 'txn type', 'category type'],
  category: ['category', 'expense category', 'income category', 'cat'],
  description: ['description', 'desc', 'memo', 'narrative', 'details', 'reference', 'particulars', 'transaction description'],
  amount: ['amount', 'value', 'sum', 'total', 'debit', 'credit', 'transaction amount']
};

// Auto-detect column mapping
function autoMapColumns(headers) {
  const mapping = {};
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());

  for (const [field, aliases] of Object.entries(COLUMN_MAP)) {
    const idx = lowerHeaders.findIndex(h => aliases.includes(h));
    if (idx !== -1) mapping[field] = idx;
  }

  // If no type column but has debit/credit, note it
  if (mapping.type === undefined) {
    const debitIdx = lowerHeaders.findIndex(h => ['debit', 'debit amount', 'money out', 'withdrawal'].includes(h));
    const creditIdx = lowerHeaders.findIndex(h => ['credit', 'credit amount', 'money in', 'deposit'].includes(h));
    if (debitIdx !== -1 || creditIdx !== -1) {
      mapping._debitCol = debitIdx;
      mapping._creditCol = creditIdx;
    }
  }

  return mapping;
}

// Parse CSV text
function parseCSV(text) {
  const lines = [];
  let current = '';
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuote && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === ',' && !inQuote) {
      lines.length === 0 ? (lines.push([current]), current = '') : (lines[lines.length - 1].push(current), current = '');
    } else if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      if (lines.length === 0) lines.push([current]);
      else lines[lines.length - 1].push(current);
      current = '';
      lines.push([]);
    } else {
      current += ch;
    }
  }
  // Last field
  if (lines.length === 0) lines.push([current]);
  else lines[lines.length - 1].push(current);

  // Remove empty trailing rows
  while (lines.length > 0 && lines[lines.length - 1].every(c => !c.trim())) lines.pop();

  return lines;
}

// Parse uploaded file (CSV or Excel)
export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'csv' || ext === 'tsv') {
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length < 2) throw new Error('File has no data rows');
    return { headers: rows[0].map(h => h.trim()), rows: rows.slice(1) };
  }

  if (ext === 'xlsx' || ext === 'xls') {
    // Load SheetJS dynamically
    const XLSX = await loadXLSX();
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (data.length < 2) throw new Error('Spreadsheet has no data rows');

    const headers = data[0].map(h => String(h).trim());
    const rows = data.slice(1).map(row =>
      row.map(cell => {
        if (cell instanceof Date) {
          return cell.toISOString().split('T')[0];
        }
        return String(cell);
      })
    );
    return { headers, rows };
  }

  throw new Error(`Unsupported file format: .${ext}. Please use CSV or Excel (.xlsx)`);
}

// Load SheetJS from CDN
let xlsxLib = null;
async function loadXLSX() {
  if (xlsxLib) return xlsxLib;
  // Load SheetJS
  const script = document.createElement('script');
  script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
  document.head.appendChild(script);
  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Excel parser'));
  });
  xlsxLib = window.XLSX;
  return xlsxLib;
}

// Convert parsed rows to entries using mapping
function mapToEntries(headers, rows, mapping, defaults = {}) {
  const entries = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.every(c => !c || !String(c).trim())) continue; // Skip empty rows

    try {
      let date = mapping.date !== undefined ? row[mapping.date] : '';
      let business = mapping.business !== undefined ? row[mapping.business] : (defaults.business || '');
      let account = mapping.account !== undefined ? row[mapping.account] : (defaults.account || 'default');
      let type = mapping.type !== undefined ? row[mapping.type] : '';
      let category = mapping.category !== undefined ? row[mapping.category] : '';
      let description = mapping.description !== undefined ? row[mapping.description] : '';
      let amount = 0;

      // Handle amount
      if (mapping.amount !== undefined) {
        amount = normalizeAmount(row[mapping.amount]);
      }

      // Handle debit/credit columns
      if (mapping._debitCol !== undefined || mapping._creditCol !== undefined) {
        const debit = mapping._debitCol !== undefined ? normalizeAmount(row[mapping._debitCol]) : 0;
        const credit = mapping._creditCol !== undefined ? normalizeAmount(row[mapping._creditCol]) : 0;
        if (credit > 0) {
          amount = credit;
          if (!type) type = 'Income';
        } else {
          amount = Math.abs(debit);
          if (!type) type = 'Expense';
        }
      }

      // Auto-detect type from amount sign if not set
      if (!type) {
        type = amount >= 0 ? 'Income' : 'Expense';
        amount = Math.abs(amount);
      }

      // Normalize type
      const typeLower = String(type).toLowerCase().trim();
      if (['income', 'credit', 'deposit', 'revenue', 'in'].includes(typeLower)) type = 'Income';
      else type = 'Expense';

      // Normalize date
      const normDate = normalizeDate(date);
      if (!normDate) {
        errors.push(`Row ${i + 2}: Invalid date "${date}"`);
        continue;
      }

      entries.push({
        date: normDate,
        business: String(business).trim() || defaults.business || '',
        account: String(account).trim() || defaults.account || 'default',
        type,
        category: String(category).trim() || 'Uncategorized',
        description: String(description).trim(),
        amount: Math.abs(amount),
        is_duplicate: false
      });
    } catch (e) {
      errors.push(`Row ${i + 2}: ${e.message}`);
    }
  }

  return { entries, errors };
}

// --- Upload UI Component ---
export function createUploadZone(container, options = {}) {
  const zone = el('div', { className: 'upload-zone', id: 'upload-zone' });

  const fileInput = el('input', {
    type: 'file',
    accept: '.csv,.xlsx,.xls',
    id: 'file-input'
  });

  zone.appendChild(icon('upload'));
  zone.appendChild(el('h4', { textContent: 'Drop CSV or Excel file here' }));
  zone.appendChild(el('p', { textContent: 'or click to browse  —  Supports .csv, .xlsx, .xls' }));
  zone.appendChild(fileInput);

  // Click to open file picker
  zone.addEventListener('click', (e) => {
    if (e.target !== fileInput) fileInput.click();
  });

  // File selected
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) handleFileUpload(fileInput.files[0], container, options);
    fileInput.value = '';
  });

  // Drag & drop
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file, container, options);
  });

  container.appendChild(zone);
  return zone;
}

// Handle file upload flow
async function handleFileUpload(file, container, options = {}) {
  // Validate file type
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['csv', 'xlsx', 'xls', 'tsv'].includes(ext)) {
    showToast('Unsupported file format. Please use CSV or Excel (.xlsx)', 'error');
    return;
  }

  // Validate file size (max 20MB)
  if (file.size > 20 * 1024 * 1024) {
    showToast('File too large. Maximum size is 20MB.', 'error');
    return;
  }

  // Show progress
  const progressHtml = `
    <div class="upload-progress" id="upload-progress">
      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: 10%"></div>
      </div>
      <p class="progress-text">Parsing ${escHtml(file.name)}...</p>
    </div>
  `;

  const zone = container.querySelector('#upload-zone');
  if (zone) zone.insertAdjacentHTML('afterend', progressHtml);

  const progressEl = container.querySelector('#upload-progress');
  const fillEl = progressEl?.querySelector('.progress-bar-fill');
  const textEl = progressEl?.querySelector('.progress-text');

  try {
    // Parse file
    if (fillEl) fillEl.style.width = '30%';
    const { headers, rows } = await parseFile(file);

    if (fillEl) fillEl.style.width = '50%';
    if (textEl) textEl.textContent = `Parsed ${rows.length} rows. Mapping columns...`;

    // Auto-map columns
    const mapping = autoMapColumns(headers);

    // Show column mapping / preview modal
    if (fillEl) fillEl.style.width = '70%';
    showMappingPreview(headers, rows, mapping, options, () => {
      // Cleanup progress
      progressEl?.remove();
    });
  } catch (err) {
    showToast(err.message || 'Failed to parse file', 'error');
    progressEl?.remove();
  }
}

// Show mapping preview modal
function showMappingPreview(headers, rows, initialMapping, options, onDone) {
  const mapping = { ...initialMapping };
  const fields = ['date', 'business', 'account', 'type', 'category', 'description', 'amount'];

  const content = el('div');

  // Column mapping section
  const mappingSection = el('div', { className: 'mb-4' });
  mappingSection.innerHTML = `<p class="text-sm text-muted mb-3">Map your file columns to the required fields. Auto-detected mappings are pre-selected.</p>`;

  const mappingGrid = el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' } });

  for (const field of fields) {
    const group = el('div', { className: 'form-group', style: { marginBottom: '8px' } });
    const label = el('label', { className: 'form-label', textContent: field.toUpperCase() });
    const select = el('select', { className: 'form-select', dataset: { field } });

    select.appendChild(el('option', { value: '-1', textContent: `— Skip —` }));
    headers.forEach((h, i) => {
      const opt = el('option', { value: String(i), textContent: h });
      if (mapping[field] === i) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      const val = parseInt(select.value);
      if (val === -1) delete mapping[field];
      else mapping[field] = val;
      updatePreview();
    });

    group.appendChild(label);
    group.appendChild(select);
    mappingGrid.appendChild(group);
  }
  mappingSection.appendChild(mappingGrid);

  // Defaults section
  const defaultsSection = el('div', { className: 'mb-4' });
  defaultsSection.innerHTML = `
    <p class="form-label" style="margin-bottom:8px">DEFAULT VALUES (for unmapped columns)</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="form-group" style="margin-bottom:0">
        <input class="form-input" id="default-business" placeholder="Default Business" value="${options.defaultBusiness || ''}">
      </div>
      <div class="form-group" style="margin-bottom:0">
        <input class="form-input" id="default-account" placeholder="Default Account" value="${options.defaultAccount || ''}">
      </div>
    </div>
  `;

  // Preview section
  const previewSection = el('div', { className: 'preview-container' });
  previewSection.innerHTML = `
    <div class="preview-header">
      <h4>Preview (first 5 rows)</h4>
      <span class="text-sm text-muted" id="preview-count">${rows.length} rows total</span>
    </div>
    <div class="preview-table-wrap">
      <table id="preview-table"><thead><tr></tr></thead><tbody></tbody></table>
    </div>
  `;

  content.appendChild(mappingSection);
  content.appendChild(defaultsSection);
  content.appendChild(previewSection);

  const { close } = showModal({
    title: 'Upload Preview & Column Mapping',
    content,
    className: 'modal-lg',
    footer: (foot, closeFn) => {
      foot.appendChild(el('button', {
        className: 'btn btn-secondary',
        textContent: 'Cancel',
        onClick: () => { closeFn(); onDone(); }
      }));

      const importBtn = el('button', {
        className: 'btn btn-primary',
        textContent: `Import ${rows.length} Rows`,
        onClick: async () => {
          await processImport(headers, rows, mapping, closeFn, onDone);
        }
      });
      importBtn.id = 'import-btn';
      foot.appendChild(importBtn);
    }
  });

  function updatePreview() {
    const table = content.querySelector('#preview-table');
    if (!table) return;

    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    const activeFields = fields.filter(f => mapping[f] !== undefined);
    if (activeFields.length === 0) {
      tbody.innerHTML = '<tr><td class="text-center text-muted" style="padding:20px">Map at least one column to see preview</td></tr>';
      return;
    }

    for (const f of activeFields) {
      thead.appendChild(el('th', { textContent: f.charAt(0).toUpperCase() + f.slice(1) }));
    }

    const previewRows = rows.slice(0, 5);
    for (const row of previewRows) {
      const tr = el('tr');
      for (const f of activeFields) {
        const val = mapping[f] !== undefined ? row[mapping[f]] || '' : '';
        tr.appendChild(el('td', { textContent: val }));
      }
      tbody.appendChild(tr);
    }
  }

  updatePreview();
}

// Process the import after user confirms
async function processImport(headers, rows, mapping, closeFn, onDone) {
  const defaultBusiness = document.getElementById('default-business')?.value || '';
  const defaultAccount = document.getElementById('default-account')?.value || '';

  const importBtn = document.getElementById('import-btn');
  if (importBtn) {
    importBtn.disabled = true;
    importBtn.textContent = 'Processing...';
  }

  // Validate required mapping
  if (mapping.date === undefined) {
    showToast('Date column is required. Please map it.', 'error');
    if (importBtn) { importBtn.disabled = false; importBtn.textContent = 'Import'; }
    return;
  }
  if (mapping.amount === undefined && mapping._debitCol === undefined && mapping._creditCol === undefined) {
    showToast('Amount column is required. Please map it.', 'error');
    if (importBtn) { importBtn.disabled = false; importBtn.textContent = 'Import'; }
    return;
  }

  // Map rows to entries
  const { entries, errors } = mapToEntries(headers, rows, mapping, {
    business: defaultBusiness,
    account: defaultAccount
  });

  if (entries.length === 0) {
    showToast(`No valid entries found. ${errors.length} errors detected.`, 'error');
    if (importBtn) { importBtn.disabled = false; importBtn.textContent = 'Import'; }
    return;
  }

  if (errors.length > 0) {
    showToast(`${errors.length} rows had issues and were skipped`, 'warning');
  }

  // Check for duplicates
  const existingEntries = store.get('entries');
  const { newEntries, duplicates } = detectDuplicates(entries, existingEntries);

  closeFn();

  if (duplicates.length > 0) {
    // Show duplicate resolution modal
    showDuplicateResolutionModal(newEntries, duplicates, async (resolvedEntries) => {
      await doInsert(resolvedEntries);
      onDone();
    });
  } else {
    await doInsert(newEntries);
    onDone();
  }
}

async function doInsert(entries) {
  if (entries.length === 0) {
    showToast('No entries to import', 'warning');
    return;
  }

  const { error } = await insertEntries(entries);
  if (error) {
    showToast(`Import failed: ${error.message}`, 'error');
  } else {
    showToast(`Successfully imported ${entries.length} transactions`, 'success');
  }
}
