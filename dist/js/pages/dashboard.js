/* ============================================
   Dashboard Page
   ============================================ */

import { store } from '../store.js';
import { fmtCurrency, fmtDate, icon, el, monthName, groupBy, sumBy } from '../utils.js';
import { skeletonKPI, skeletonChart, skeletonTable } from '../ui.js';
import { loadChartJs, renderCashFlowChart, renderTrendChart, renderCategoryChart } from '../charts.js';

export function renderDashboard(container) {
  if (store.get('loading')) {
    container.innerHTML = skeletonKPI() + `<div class="grid-2">${skeletonChart()}${skeletonChart()}</div>` + skeletonTable();
    return;
  }

  const entries = store.get('entries');
  const totalIncome = store.totalIncome;
  const totalExpense = store.totalExpense;
  const net = store.netCashFlow;
  const monthlyData = store.monthlyData;
  const catData = store.categoryBreakdown;
  const accountData = store.accountBreakdown;

  // Operating revenue (exclude loans, investments, capital)
  const capitalCats = ['business loan', 'external investment', 'owner capital', 'loan', 'investment', 'capital'];
  const opRevenue = entries
    .filter(e => e.type === 'Income' && !capitalCats.includes(e.category.toLowerCase()))
    .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  container.innerHTML = '';

  // --- KPI Cards ---
  const kpiGrid = el('div', { className: 'kpi-grid fade-in' });
  kpiGrid.innerHTML = `
    <div class="kpi-card income">
      <div class="kpi-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
        Total Cash In
      </div>
      <div class="kpi-value text-green">${fmtCurrency(totalIncome)}</div>
      <div class="kpi-sub">${entries.filter(e => e.type === 'Income').length} income transactions</div>
    </div>
    <div class="kpi-card expense">
      <div class="kpi-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        Total Cash Out
      </div>
      <div class="kpi-value text-red">${fmtCurrency(totalExpense)}</div>
      <div class="kpi-sub">${entries.filter(e => e.type === 'Expense').length} expense transactions</div>
    </div>
    <div class="kpi-card net">
      <div class="kpi-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>
        Net Cash Flow
      </div>
      <div class="kpi-value" style="color:${net >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtCurrency(net)}</div>
      <div class="kpi-sub">${net >= 0 ? 'Positive' : 'Negative'} cash position</div>
    </div>
    <div class="kpi-card revenue">
      <div class="kpi-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
        Operating Revenue
      </div>
      <div class="kpi-value" style="color:var(--blue)">${fmtCurrency(opRevenue)}</div>
      <div class="kpi-sub">Excluding loans &amp; capital</div>
    </div>
  `;
  container.appendChild(kpiGrid);

  // --- Account Breakdown ---
  if (accountData.length > 0) {
    const accCard = el('div', { className: 'card mb-4 fade-in' });
    accCard.innerHTML = `
      <div class="card-header"><h3>Account Breakdown</h3></div>
      <div class="card-body">
        <div class="table-container">
          <table>
            <thead><tr><th>Account</th><th class="text-right">Income</th><th class="text-right">Expenses</th><th class="text-right">Net</th></tr></thead>
            <tbody>
              ${accountData.map(a => `
                <tr>
                  <td><span class="badge badge-accent">${a.account}</span></td>
                  <td class="text-right amount-positive">${fmtCurrency(a.income)}</td>
                  <td class="text-right amount-negative">${fmtCurrency(a.expense)}</td>
                  <td class="text-right" style="font-weight:600;color:${a.net >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtCurrency(a.net)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    container.appendChild(accCard);
  }

  // --- Charts Row ---
  const chartsRow = el('div', { className: 'grid-2 fade-in' });

  // Monthly Cash Flow
  chartsRow.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Monthly Cash Flow</h3></div>
      <div class="card-body">
        <div class="chart-container" style="height:280px">
          <canvas id="chart-cashflow"></canvas>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Expense Categories</h3></div>
      <div class="card-body">
        <div class="chart-container" style="height:280px">
          <canvas id="chart-categories"></canvas>
        </div>
      </div>
    </div>
  `;
  container.appendChild(chartsRow);

  // --- Trend Chart ---
  const trendCard = el('div', { className: 'card mb-4 fade-in' });
  trendCard.innerHTML = `
    <div class="card-header"><h3>Monthly Trend</h3></div>
    <div class="card-body">
      <div class="chart-container" style="height:280px">
        <canvas id="chart-trend"></canvas>
      </div>
    </div>
  `;
  container.appendChild(trendCard);

  // --- Expense Breakdown Table ---
  if (catData.length > 0) {
    const totalExp = catData.reduce((s, c) => s + c.amount, 0);
    const expCard = el('div', { className: 'card mb-4 fade-in' });
    expCard.innerHTML = `
      <div class="card-header"><h3>Expense Breakdown</h3></div>
      <div class="card-body">
        <div class="table-container">
          <table>
            <thead><tr><th>Category</th><th class="text-right">Amount</th><th class="text-right">% of Total</th><th style="width:30%">Share</th></tr></thead>
            <tbody>
              ${catData.map(c => {
                const pct = totalExp > 0 ? ((c.amount / totalExp) * 100) : 0;
                return `
                  <tr>
                    <td><strong>${c.category}</strong></td>
                    <td class="text-right amount-negative">${fmtCurrency(c.amount)}</td>
                    <td class="text-right">${pct.toFixed(1)}%</td>
                    <td>
                      <div style="width:100%;height:6px;background:var(--bg-input);border-radius:3px;overflow:hidden">
                        <div style="width:${pct}%;height:100%;background:var(--accent);border-radius:3px"></div>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    container.appendChild(expCard);
  }

  // --- Monthly Summary Table ---
  if (monthlyData.length > 0) {
    const monthCard = el('div', { className: 'card fade-in' });
    monthCard.innerHTML = `
      <div class="card-header"><h3>Monthly Summary</h3></div>
      <div class="card-body">
        <div class="table-container">
          <table>
            <thead><tr><th>Month</th><th class="text-right">Income</th><th class="text-right">Expenses</th><th class="text-right">Net</th></tr></thead>
            <tbody>
              ${monthlyData.map(m => `
                <tr>
                  <td><strong>${m.month}</strong></td>
                  <td class="text-right amount-positive">${fmtCurrency(m.income)}</td>
                  <td class="text-right amount-negative">${fmtCurrency(m.expense)}</td>
                  <td class="text-right" style="font-weight:600;color:${m.net >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtCurrency(m.net)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    container.appendChild(monthCard);
  }

  // Empty state
  if (entries.length === 0) {
    container.innerHTML = `
      <div class="kpi-grid">
        ${['Total Cash In', 'Total Cash Out', 'Net Cash Flow', 'Operating Revenue'].map(l => `
          <div class="kpi-card"><div class="kpi-label">${l}</div><div class="kpi-value" style="color:var(--text-tertiary)">--</div></div>
        `).join('')}
      </div>
      <div class="empty-state" style="padding:80px 20px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="48" height="48" style="opacity:0.3;margin:0 auto 16px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
        <h4>No transactions yet</h4>
        <p>Upload a CSV or Excel file to get started</p>
      </div>
    `;
    return;
  }

  // Render charts after DOM is ready
  requestAnimationFrame(async () => {
    await loadChartJs();
    if (monthlyData.length > 0) {
      renderCashFlowChart('chart-cashflow', monthlyData);
      renderTrendChart('chart-trend', monthlyData);
    }
    if (catData.length > 0) {
      renderCategoryChart('chart-categories', catData);
    }
  });
}
