/* ============================================
   Duplicate Detection System
   ============================================ */

import { el, icon } from './utils.js';
import { showModal, showToast } from './ui.js';

// Generate a fingerprint for duplicate detection
function entryFingerprint(entry) {
  return [
    entry.date,
    Math.abs(parseFloat(entry.amount) || 0).toFixed(2),
    String(entry.description || '').toLowerCase().trim().slice(0, 50),
    String(entry.account || '').toLowerCase().trim()
  ].join('|');
}

// Detect duplicates between new entries and existing entries
export function detectDuplicates(newEntries, existingEntries) {
  const existingFingerprints = new Map();

  // Build fingerprint map from existing entries
  for (const entry of existingEntries) {
    const fp = entryFingerprint(entry);
    if (!existingFingerprints.has(fp)) existingFingerprints.set(fp, []);
    existingFingerprints.get(fp).push(entry);
  }

  const clean = [];
  const dupes = [];

  for (const entry of newEntries) {
    const fp = entryFingerprint(entry);
    if (existingFingerprints.has(fp)) {
      dupes.push({
        entry,
        existingMatches: existingFingerprints.get(fp),
        fingerprint: fp
      });
    } else {
      clean.push(entry);
    }
  }

  // Also check within the new entries themselves for internal duplicates
  const seenNew = new Map();
  const finalClean = [];
  for (const entry of clean) {
    const fp = entryFingerprint(entry);
    if (seenNew.has(fp)) {
      dupes.push({
        entry,
        existingMatches: [seenNew.get(fp)],
        fingerprint: fp,
        isInternal: true
      });
    } else {
      seenNew.set(fp, entry);
      finalClean.push(entry);
    }
  }

  return { newEntries: finalClean, duplicates: dupes };
}

// Show duplicate resolution modal
export function showDuplicateResolutionModal(cleanEntries, duplicates, onResolve) {
  const content = el('div');

  // Banner
  const banner = el('div', { className: 'duplicate-banner' });
  banner.appendChild(icon('alert'));
  banner.appendChild(el('p', {
    innerHTML: `<strong>${duplicates.length} potential duplicate${duplicates.length > 1 ? 's' : ''}</strong> found. Choose how to handle them.`
  }));
  content.appendChild(banner);

  // Resolution options
  const optionsDiv = el('div', { className: 'mb-4' });
  optionsDiv.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px">
      <label style="display:flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid var(--border-color);border-radius:var(--radius-md);cursor:pointer;transition:all 150ms">
        <input type="radio" name="dup-action" value="skip" checked style="accent-color:var(--accent)">
        <div>
          <strong style="font-size:13px">Skip duplicates</strong>
          <p style="font-size:12px;color:var(--text-secondary);margin-top:2px">Only import ${cleanEntries.length} new unique transactions</p>
        </div>
      </label>
      <label style="display:flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid var(--border-color);border-radius:var(--radius-md);cursor:pointer;transition:all 150ms">
        <input type="radio" name="dup-action" value="keep" style="accent-color:var(--accent)">
        <div>
          <strong style="font-size:13px">Keep both</strong>
          <p style="font-size:12px;color:var(--text-secondary);margin-top:2px">Import all ${cleanEntries.length + duplicates.length} transactions (duplicates flagged)</p>
        </div>
      </label>
      <label style="display:flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid var(--border-color);border-radius:var(--radius-md);cursor:pointer;transition:all 150ms">
        <input type="radio" name="dup-action" value="replace" style="accent-color:var(--accent)">
        <div>
          <strong style="font-size:13px">Replace existing</strong>
          <p style="font-size:12px;color:var(--text-secondary);margin-top:2px">Replace ${duplicates.length} existing entries with new data</p>
        </div>
      </label>
    </div>
  `;
  content.appendChild(optionsDiv);

  // Duplicate details (collapsible)
  const detailsDiv = el('div');
  const toggleBtn = el('button', {
    className: 'btn btn-ghost text-sm',
    textContent: 'Show duplicate details',
    onClick: () => {
      const list = detailsDiv.querySelector('.dup-list');
      if (list.style.display === 'none') {
        list.style.display = 'block';
        toggleBtn.textContent = 'Hide duplicate details';
      } else {
        list.style.display = 'none';
        toggleBtn.textContent = 'Show duplicate details';
      }
    }
  });
  detailsDiv.appendChild(toggleBtn);

  const dupList = el('div', { className: 'dup-list', style: { display: 'none', marginTop: '10px', maxHeight: '200px', overflowY: 'auto' } });
  const table = el('table');
  table.innerHTML = `
    <thead>
      <tr><th>Date</th><th>Description</th><th>Amount</th><th>Account</th></tr>
    </thead>
    <tbody>
      ${duplicates.slice(0, 20).map(d => `
        <tr>
          <td>${d.entry.date}</td>
          <td class="truncate" style="max-width:200px">${d.entry.description || '—'}</td>
          <td>${parseFloat(d.entry.amount).toFixed(2)}</td>
          <td>${d.entry.account}</td>
        </tr>
      `).join('')}
      ${duplicates.length > 20 ? `<tr><td colspan="4" class="text-center text-muted">...and ${duplicates.length - 20} more</td></tr>` : ''}
    </tbody>
  `;
  dupList.appendChild(table);
  detailsDiv.appendChild(dupList);
  content.appendChild(detailsDiv);

  showModal({
    title: 'Duplicate Transactions Found',
    content,
    className: 'modal-lg',
    footer: (foot, closeFn) => {
      foot.appendChild(el('button', {
        className: 'btn btn-secondary',
        textContent: 'Cancel Import',
        onClick: closeFn
      }));
      foot.appendChild(el('button', {
        className: 'btn btn-primary',
        textContent: 'Continue Import',
        onClick: () => {
          const action = content.querySelector('input[name="dup-action"]:checked')?.value || 'skip';
          let result = [...cleanEntries];

          if (action === 'keep') {
            // Import all, mark duplicates
            const dupEntries = duplicates.map(d => ({
              ...d.entry,
              is_duplicate: true
            }));
            result = [...cleanEntries, ...dupEntries];
          } else if (action === 'replace') {
            // Import all as new (caller should delete existing matches)
            const dupEntries = duplicates.map(d => d.entry);
            result = [...cleanEntries, ...dupEntries];
            // Note: actual replacement of existing entries is handled by the caller
          }
          // 'skip' = just cleanEntries (default)

          closeFn();
          onResolve(result);
        }
      }));
    }
  });
}
