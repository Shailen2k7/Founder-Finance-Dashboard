/* ============================================
   Accounts Page
   ============================================ */

import { store } from '../store.js';
import { fmtCurrency, fmtDate, el, icon, escHtml } from '../utils.js';
import { showToast, emptyState, skeletonTable } from '../ui.js';
import { createUploadZone } from '../upload.js';

export function renderAccounts(container) {
  if (store.get('loading')) {
    container.innerHTML = skeletonTable(6);
    return;
  }

  const entries = store.get('entries');
  const accounts = store.accounts;
  container.innerHTML = '';

  // --- Account Summary Cards ---
  const accountData = store.accountBreakdown;

  if (accountData.length > 0) {
    const grid = el('div', { className: 'kpi-grid fade-in', style: { gridTemplateColumns: `repeat(${Math.min(accountData.length, 4)}, 1fr)` } });
    for (const acc of accountData) {
      const card = el('div', { className: 'kpi-card' });
      card.style.borderTop = `3px solid var(--accent)`;
      card.innerHTML = `
        <div class="kpi-label">${escHtml(acc.account)}</div>
        <div class="kpi-value" style="font-size:20px;color:${acc.net >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtCurrency(acc.net)}</div>
        <div class="kpi-sub">
          <span class="text-green">${fmtCurrency(acc.income)} in</span> / <span class="text-red">${fmtCurrency(acc.expense)} out</span>
        </div>
      `;
      grid.appendChild(card);
    }
    container.appendChild(grid);
  }

  // --- Upload Section ---
  const uploadCard = el('div', { className: 'card mb-4 fade-in' });
  uploadCard.innerHTML = `<div class="card-header"><h3>Import Bank Statement</h3></div>`;
  const uploadBody = el('div', { className: 'card-body' });
  uploadCard.appendChild(uploadBody);
  container.appendChild(uploadCard);
  createUploadZone(uploadBody);

  // --- Account Tabs + Table ---
  const tableCard = el('div', { className: 'card fade-in' });
  const tabs = el('div', { className: 'tabs' });

  const allTab = el('button', {
    className: 'tab-item active',
    textContent: 'All Accounts',
    dataset: { account: 'all' }
  });
  tabs.appendChild(allTab);

  for (const acc of accounts) {
    tabs.appendChild(el('button', {
      className: 'tab-item',
      textContent: acc,
      dataset: { account: acc }
    }));
  }

  tableCard.appendChild(tabs);

  const tableBody = el('div', { id: 'account-table-body' });
  tableCard.appendChild(tableBody);
  container.appendChild(tableCard);

  // Tab switching
  let activeAccount = 'all';
  tabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab-item');
    if (!tab) return;
    tabs.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeAccount = tab.dataset.account;
    renderAccountTable(activeAccount);
  });

  renderAccountTable('all');
}

function renderAccountTable(accountFilter) {
  const tableBody = document.getElementById('account-table-body');
  if (!tableBody) return;

  const entries = store.get('entries').filter(e =>
    accountFilter === 'all' || e.account === accountFilter
  ).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (entries.length === 0) {
    tableBody.innerHTML = '';
    tableBody.appendChild(emptyState('accounts', 'No transactions', 'Upload a bank statement to see data here'));
    return;
  }

  const recentEntries = entries.slice(0, 100);

  tableBody.innerHTML = `
    <div class="card-body" style="padding:0">
      <div class="table-container">
        <table>
          <thead>
            <tr><th>Date</th><th>Account</th><th>Type</th><th>Category</th><th>Description</th><th class="text-right">Amount</th></tr>
          </thead>
          <tbody>
            ${recentEntries.map(e => `
              <tr>
                <td>${fmtDate(e.date)}</td>
                <td><span class="badge badge-accent">${escHtml(e.account)}</span></td>
                <td><span class="badge ${e.type === 'Income' ? 'badge-income' : 'badge-expense'}">${e.type}</span></td>
                <td>${escHtml(e.category)}</td>
                <td class="truncate" style="max-width:250px">${escHtml(e.description)}</td>
                <td class="text-right ${e.type === 'Income' ? 'amount-positive' : 'amount-negative'}">${fmtCurrency(Math.abs(e.amount))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${entries.length > 100 ? `<div class="text-center text-sm text-muted" style="padding:12px">Showing 100 of ${entries.length} transactions</div>` : ''}
    </div>
  `;
}
