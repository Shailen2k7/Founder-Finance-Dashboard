/* ============================================
   Entries Page — All Transactions
   ============================================ */

import { store } from '../store.js';
import { fmtCurrency, fmtDate, el, icon, debounce, escHtml } from '../utils.js';
import { showModal, showConfirm, showToast, emptyState, skeletonTable } from '../ui.js';
import { updateEntry, deleteEntry } from '../supabase.js';
import { createUploadZone } from '../upload.js';
import { showExportMenu } from '../reports.js';

let currentPage = 1;
const PAGE_SIZE = 50;

export function renderEntries(container) {
  if (store.get('loading')) {
    container.innerHTML = skeletonTable(8);
    return;
  }

  container.innerHTML = '';

  // --- Top Actions Bar ---
  const actionsBar = el('div', { className: 'flex items-center justify-between mb-4 flex-wrap gap-2 fade-in' });

  // Left: Upload button
  const leftActions = el('div', { className: 'flex items-center gap-2' });
  const uploadBtn = el('button', { className: 'btn btn-primary', onClick: () => showUploadModal() });
  uploadBtn.appendChild(icon('upload'));
  uploadBtn.appendChild(document.createTextNode(' Upload'));
  leftActions.appendChild(uploadBtn);

  const exportBtn = el('button', {
    className: 'btn btn-secondary',
    onClick: () => showExportMenu(store.filteredEntries)
  });
  exportBtn.appendChild(icon('download'));
  exportBtn.appendChild(document.createTextNode(' Export'));
  leftActions.appendChild(exportBtn);

  // Right: Search
  const rightActions = el('div', { className: 'flex items-center gap-2' });
  const searchWrap = el('div', { className: 'search-input-wrap' });
  searchWrap.appendChild(icon('search'));
  const searchInput = el('input', {
    className: 'form-input',
    type: 'text',
    placeholder: 'Search transactions...',
    value: store.get('filters').search || ''
  });
  searchInput.addEventListener('input', debounce((e) => {
    store.set({ filters: { ...store.get('filters'), search: e.target.value } });
    renderEntryTable();
    currentPage = 1;
  }, 250));
  searchWrap.appendChild(searchInput);
  rightActions.appendChild(searchWrap);

  actionsBar.appendChild(leftActions);
  actionsBar.appendChild(rightActions);
  container.appendChild(actionsBar);

  // --- Filters ---
  const filtersBar = el('div', { className: 'filters-bar fade-in' });
  const filters = store.get('filters');

  // Business filter
  filtersBar.appendChild(createFilterSelect('Business', 'business', store.businesses, filters.business));
  // Type filter
  filtersBar.appendChild(createFilterSelect('Type', 'type', ['Income', 'Expense'], filters.type));
  // Account filter
  filtersBar.appendChild(createFilterSelect('Account', 'account', store.accounts, filters.account));
  // Category filter
  filtersBar.appendChild(createFilterSelect('Category', 'category', store.categories, filters.category));
  // Year filter
  filtersBar.appendChild(createFilterSelect('Year', 'year', store.years, filters.year));

  // Date range
  const dateFrom = el('input', {
    className: 'form-input',
    type: 'date',
    value: filters.dateFrom || '',
    style: { width: '130px', fontSize: '12px' },
    title: 'From date'
  });
  dateFrom.addEventListener('change', () => {
    store.set({ filters: { ...store.get('filters'), dateFrom: dateFrom.value } });
    renderEntryTable();
  });

  const dateTo = el('input', {
    className: 'form-input',
    type: 'date',
    value: filters.dateTo || '',
    style: { width: '130px', fontSize: '12px' },
    title: 'To date'
  });
  dateTo.addEventListener('change', () => {
    store.set({ filters: { ...store.get('filters'), dateTo: dateTo.value } });
    renderEntryTable();
  });

  filtersBar.appendChild(dateFrom);
  filtersBar.appendChild(dateTo);

  // Reset filters
  if (Object.values(filters).some(v => v && v !== 'all')) {
    const resetBtn = el('button', {
      className: 'btn btn-ghost btn-sm',
      textContent: 'Clear Filters',
      onClick: () => {
        store.set({
          filters: { business: 'all', type: 'all', account: 'all', category: 'all', year: 'all', month: 'all', search: '', dateFrom: '', dateTo: '' }
        });
        renderEntries(container);
      }
    });
    filtersBar.appendChild(resetBtn);
  }

  container.appendChild(filtersBar);

  // --- Results Summary ---
  const filtered = store.filteredEntries;
  const summaryDiv = el('div', { className: 'flex items-center justify-between mb-3 text-sm text-muted fade-in' });
  const income = filtered.filter(e => e.type === 'Income').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const expense = filtered.filter(e => e.type === 'Expense').reduce((s, e) => s + Math.abs(parseFloat(e.amount) || 0), 0);
  summaryDiv.innerHTML = `
    <span>${filtered.length} transactions</span>
    <span>
      <span class="text-green">${fmtCurrency(income)} in</span> &nbsp;|&nbsp;
      <span class="text-red">${fmtCurrency(expense)} out</span> &nbsp;|&nbsp;
      Net: <strong style="color:${income - expense >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtCurrency(income - expense)}</strong>
    </span>
  `;
  container.appendChild(summaryDiv);

  // --- Table ---
  const tableCard = el('div', { className: 'card fade-in', id: 'entries-table-card' });
  container.appendChild(tableCard);
  renderEntryTable();
}

function renderEntryTable() {
  const card = document.getElementById('entries-table-card');
  if (!card) return;

  const filtered = store.filteredEntries;

  if (filtered.length === 0) {
    card.innerHTML = '';
    card.appendChild(emptyState('entries', 'No transactions found', 'Try adjusting your filters or upload data'));
    return;
  }

  // Sort by date descending
  const sorted = [...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageData = sorted.slice(start, start + PAGE_SIZE);

  card.innerHTML = `
    <div class="card-body" style="padding:0">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Business</th>
              <th>Account</th>
              <th>Type</th>
              <th>Category</th>
              <th>Description</th>
              <th class="text-right">Amount</th>
              <th style="width:70px"></th>
            </tr>
          </thead>
          <tbody id="entries-tbody">
            ${pageData.map(e => `
              <tr data-id="${e.id}" class="${e.is_duplicate ? 'duplicate-row' : ''}">
                <td>${fmtDate(e.date)}</td>
                <td>${escHtml(e.business)}</td>
                <td><span class="badge badge-accent">${escHtml(e.account)}</span></td>
                <td><span class="badge ${e.type === 'Income' ? 'badge-income' : 'badge-expense'}">${e.type}</span></td>
                <td>${escHtml(e.category)}</td>
                <td class="truncate" style="max-width:200px" title="${escHtml(e.description)}">${escHtml(e.description)}</td>
                <td class="text-right ${e.type === 'Income' ? 'amount-positive' : 'amount-negative'}">${e.type === 'Income' ? '+' : '-'}${fmtCurrency(Math.abs(e.amount))}</td>
                <td>
                  <div class="flex gap-2" style="justify-content:flex-end">
                    <button class="btn btn-ghost btn-icon btn-sm edit-btn" data-id="${e.id}" title="Edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button class="btn btn-ghost btn-icon btn-sm del-btn" data-id="${e.id}" title="Delete">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
              ${e.is_duplicate ? `<tr><td colspan="8" style="padding:2px 14px 8px"><span class="badge badge-duplicate" style="font-size:10px">Duplicate</span></td></tr>` : ''}
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Pagination
  if (totalPages > 1) {
    const pagination = el('div', {
      className: 'flex items-center justify-between',
      style: { padding: '12px 20px', borderTop: '1px solid var(--border-light)' }
    });
    pagination.innerHTML = `
      <span class="text-sm text-muted">Page ${currentPage} of ${totalPages} (${filtered.length} total)</span>
      <div class="flex gap-2">
        <button class="btn btn-secondary btn-sm" id="prev-page" ${currentPage <= 1 ? 'disabled' : ''}>Previous</button>
        <button class="btn btn-secondary btn-sm" id="next-page" ${currentPage >= totalPages ? 'disabled' : ''}>Next</button>
      </div>
    `;
    card.appendChild(pagination);

    pagination.querySelector('#prev-page')?.addEventListener('click', () => {
      if (currentPage > 1) { currentPage--; renderEntryTable(); }
    });
    pagination.querySelector('#next-page')?.addEventListener('click', () => {
      if (currentPage < totalPages) { currentPage++; renderEntryTable(); }
    });
  }

  // Event delegation for edit/delete
  const tbody = card.querySelector('#entries-tbody');
  tbody?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-btn');
    const delBtn = e.target.closest('.del-btn');

    if (editBtn) {
      const id = editBtn.dataset.id;
      const entry = store.get('entries').find(en => String(en.id) === id);
      if (entry) showEditModal(entry);
    }

    if (delBtn) {
      const id = delBtn.dataset.id;
      showConfirm('Are you sure you want to delete this transaction?', async () => {
        const { error } = await deleteEntry(parseInt(id));
        if (error) showToast('Delete failed: ' + error.message, 'error');
        else {
          showToast('Transaction deleted', 'success');
          renderEntryTable();
        }
      });
    }
  });
}

function createFilterSelect(label, key, options, currentValue) {
  const select = el('select', {
    className: 'form-select',
    style: { width: 'auto', minWidth: '100px', fontSize: '12px', padding: '6px 10px' }
  });
  select.appendChild(el('option', { value: 'all', textContent: `All ${label}s` }));
  for (const opt of options) {
    const o = el('option', { value: opt, textContent: opt });
    if (opt === currentValue) o.selected = true;
    select.appendChild(o);
  }
  select.addEventListener('change', () => {
    store.set({ filters: { ...store.get('filters'), [key]: select.value } });
    currentPage = 1;
    renderEntryTable();
    // Update summary
    const summaryDiv = document.querySelector('.page-content .text-sm.text-muted.flex');
    if (summaryDiv) {
      const filtered = store.filteredEntries;
      const income = filtered.filter(e => e.type === 'Income').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
      const expense = filtered.filter(e => e.type === 'Expense').reduce((s, e) => s + Math.abs(parseFloat(e.amount) || 0), 0);
      summaryDiv.innerHTML = `
        <span>${filtered.length} transactions</span>
        <span>
          <span class="text-green">${fmtCurrency(income)} in</span> &nbsp;|&nbsp;
          <span class="text-red">${fmtCurrency(expense)} out</span> &nbsp;|&nbsp;
          Net: <strong style="color:${income - expense >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtCurrency(income - expense)}</strong>
        </span>
      `;
    }
  });
  return select;
}

function showUploadModal() {
  const content = el('div');
  const uploadContainer = el('div');
  content.appendChild(uploadContainer);

  const { close } = showModal({
    title: 'Upload Transactions',
    content,
    className: 'modal-lg'
  });

  createUploadZone(uploadContainer, {
    defaultBusiness: '',
    defaultAccount: ''
  });
}

function showEditModal(entry) {
  const content = el('div');
  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label class="form-label">Date</label>
        <input class="form-input" type="date" id="edit-date" value="${entry.date}">
      </div>
      <div class="form-group">
        <label class="form-label">Amount</label>
        <input class="form-input" type="number" step="0.01" id="edit-amount" value="${Math.abs(entry.amount)}">
      </div>
      <div class="form-group">
        <label class="form-label">Business</label>
        <input class="form-input" id="edit-business" value="${escHtml(entry.business)}">
      </div>
      <div class="form-group">
        <label class="form-label">Account</label>
        <input class="form-input" id="edit-account" value="${escHtml(entry.account)}">
      </div>
      <div class="form-group">
        <label class="form-label">Type</label>
        <select class="form-select" id="edit-type">
          <option value="Income" ${entry.type === 'Income' ? 'selected' : ''}>Income</option>
          <option value="Expense" ${entry.type === 'Expense' ? 'selected' : ''}>Expense</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <input class="form-input" id="edit-category" value="${escHtml(entry.category)}">
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label class="form-label">Description</label>
        <input class="form-input" id="edit-description" value="${escHtml(entry.description)}">
      </div>
    </div>
  `;

  showModal({
    title: 'Edit Transaction',
    content,
    footer: (foot, closeFn) => {
      foot.appendChild(el('button', {
        className: 'btn btn-secondary',
        textContent: 'Cancel',
        onClick: closeFn
      }));
      foot.appendChild(el('button', {
        className: 'btn btn-primary',
        textContent: 'Save',
        onClick: async () => {
          const updates = {
            date: document.getElementById('edit-date').value,
            amount: parseFloat(document.getElementById('edit-amount').value) || 0,
            business: document.getElementById('edit-business').value,
            account: document.getElementById('edit-account').value,
            type: document.getElementById('edit-type').value,
            category: document.getElementById('edit-category').value,
            description: document.getElementById('edit-description').value
          };
          const { error } = await updateEntry(entry.id, updates);
          if (error) showToast('Update failed', 'error');
          else {
            showToast('Transaction updated', 'success');
            closeFn();
            renderEntryTable();
          }
        }
      }));
    }
  });
}
