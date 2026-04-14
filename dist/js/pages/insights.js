/* ============================================
   Insights Page — Financial Analysis
   ============================================ */

import { store } from '../store.js';
import { fmtCurrency, el, escHtml } from '../utils.js';
import { emptyState } from '../ui.js';

export function renderInsights(container) {
  const entries = store.get('entries');
  container.innerHTML = '';

  if (entries.length === 0) {
    container.appendChild(emptyState('insights', 'No data for insights', 'Upload transactions to see financial analysis'));
    return;
  }

  const totalIncome = store.totalIncome;
  const totalExpense = store.totalExpense;
  const net = store.netCashFlow;
  const monthlyData = store.monthlyData;
  const catData = store.categoryBreakdown;

  // Calculate metrics
  const monthCount = Math.max(monthlyData.length, 1);
  const avgMonthlyExpense = totalExpense / monthCount;
  const avgMonthlyIncome = totalIncome / monthCount;
  const burnRate = avgMonthlyExpense - avgMonthlyIncome;
  const runway = burnRate > 0 ? Math.round(net / burnRate) : Infinity;

  // Health score (0-100)
  let healthScore = 50;
  if (net > 0) healthScore += 15;
  if (totalIncome > totalExpense) healthScore += 15;
  if (runway > 12 || runway === Infinity) healthScore += 10;
  else if (runway > 6) healthScore += 5;
  if (monthlyData.length >= 3) {
    const recent = monthlyData.slice(-3);
    const recentNet = recent.reduce((s, m) => s + m.net, 0);
    if (recentNet > 0) healthScore += 10;
  }
  healthScore = Math.min(100, Math.max(0, healthScore));

  const healthColor = healthScore >= 70 ? 'var(--green)' : healthScore >= 40 ? 'var(--amber)' : 'var(--red)';
  const healthLabel = healthScore >= 70 ? 'Healthy' : healthScore >= 40 ? 'Moderate' : 'At Risk';

  // --- Health Score Card ---
  const headerGrid = el('div', { className: 'grid-3 fade-in', style: { marginBottom: '24px' } });
  headerGrid.innerHTML = `
    <div class="insight-card health-score" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">
      <div class="text-sm" style="opacity:0.8;margin-bottom:8px">Financial Health</div>
      <div class="score-value">${healthScore}</div>
      <div style="font-size:14px;font-weight:600;margin-top:4px">${healthLabel}</div>
    </div>
    <div class="insight-card">
      <div class="text-sm text-muted mb-2">Monthly Burn Rate</div>
      <div style="font-size:24px;font-weight:700;color:${burnRate > 0 ? 'var(--red)' : 'var(--green)'}">${fmtCurrency(Math.abs(burnRate))}</div>
      <div class="text-xs text-muted mt-1">${burnRate > 0 ? 'Spending exceeds income' : 'Income exceeds expenses'}/month</div>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-light)">
        <div class="text-sm text-muted">Runway</div>
        <div style="font-size:18px;font-weight:700;color:var(--accent)">
          ${runway === Infinity ? 'Sustainable' : runway <= 0 ? 'N/A' : `${runway} months`}
        </div>
      </div>
    </div>
    <div class="insight-card">
      <div class="text-sm text-muted mb-2">Next 30 Days Forecast</div>
      <div style="font-size:24px;font-weight:700;color:${avgMonthlyIncome - avgMonthlyExpense >= 0 ? 'var(--green)' : 'var(--red)'}">
        ${fmtCurrency(avgMonthlyIncome - avgMonthlyExpense)}
      </div>
      <div class="text-xs text-muted mt-1">Based on ${monthCount}-month average</div>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-light)">
        <div class="flex justify-between text-sm">
          <span class="text-muted">Avg Income</span>
          <span class="text-green font-mono">${fmtCurrency(avgMonthlyIncome)}</span>
        </div>
        <div class="flex justify-between text-sm mt-1">
          <span class="text-muted">Avg Expense</span>
          <span class="text-red font-mono">${fmtCurrency(avgMonthlyExpense)}</span>
        </div>
      </div>
    </div>
  `;
  container.appendChild(headerGrid);

  // --- Risk Alerts ---
  const risks = [];
  if (burnRate > 0) risks.push({ level: 'high', text: `Negative cash flow: spending exceeds income by ${fmtCurrency(burnRate)}/month` });
  if (runway > 0 && runway < 6 && runway !== Infinity) risks.push({ level: 'high', text: `Low runway: only ${runway} months of cash remaining at current burn rate` });
  if (catData.length > 0 && catData[0].amount > totalExpense * 0.4) risks.push({ level: 'medium', text: `High concentration: "${catData[0].category}" makes up ${((catData[0].amount / totalExpense) * 100).toFixed(0)}% of expenses` });
  if (monthlyData.length >= 3) {
    const last3 = monthlyData.slice(-3);
    const expenseTrend = last3[2]?.expense > last3[0]?.expense * 1.2;
    if (expenseTrend) risks.push({ level: 'medium', text: 'Rising expenses: spending increased 20%+ over last 3 months' });
  }
  if (entries.filter(e => e.is_duplicate).length > 5) risks.push({ level: 'low', text: `${entries.filter(e => e.is_duplicate).length} duplicate transactions detected — review them` });

  if (risks.length > 0) {
    const riskCard = el('div', { className: 'card mb-4 fade-in' });
    riskCard.innerHTML = `
      <div class="card-header"><h3>Risk Alerts</h3></div>
      <div class="card-body">
        ${risks.map(r => `
          <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-light)">
            <span class="badge" style="background:${r.level === 'high' ? 'var(--red-bg)' : r.level === 'medium' ? 'var(--amber-bg)' : 'var(--blue-bg)'};color:${r.level === 'high' ? 'var(--red-text)' : r.level === 'medium' ? 'var(--amber-text)' : 'var(--blue-text)'}">${r.level.toUpperCase()}</span>
            <span class="text-sm">${r.text}</span>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(riskCard);
  }

  // --- Insights Cards ---
  const insightsGrid = el('div', { className: 'grid-2 fade-in' });

  // Top categories
  const topCats = catData.slice(0, 5);
  insightsGrid.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Top Expense Categories</h3></div>
      <div class="card-body">
        ${topCats.map((c, i) => {
          const pct = totalExpense > 0 ? ((c.amount / totalExpense) * 100) : 0;
          return `
            <div style="margin-bottom:12px">
              <div class="flex justify-between text-sm mb-1">
                <span><strong>${i + 1}.</strong> ${escHtml(c.category)}</span>
                <span class="font-mono">${fmtCurrency(c.amount)} (${pct.toFixed(1)}%)</span>
              </div>
              <div style="width:100%;height:5px;background:var(--bg-input);border-radius:3px">
                <div style="width:${pct}%;height:100%;background:var(--accent);border-radius:3px"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Recommendations</h3></div>
      <div class="card-body">
        ${generateRecommendations(entries, monthlyData, catData, totalIncome, totalExpense, burnRate).map(r => `
          <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-light)">
            <span style="font-size:16px">${r.icon}</span>
            <div>
              <div class="text-sm"><strong>${escHtml(r.title)}</strong></div>
              <div class="text-xs text-muted mt-1">${escHtml(r.desc)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  container.appendChild(insightsGrid);

  // --- Monthly Growth Table ---
  if (monthlyData.length >= 2) {
    const growthCard = el('div', { className: 'card mt-4 fade-in' });
    growthCard.innerHTML = `
      <div class="card-header"><h3>Monthly Growth</h3></div>
      <div class="card-body" style="padding:0">
        <div class="table-container">
          <table>
            <thead><tr><th>Month</th><th class="text-right">Income</th><th class="text-right">Expenses</th><th class="text-right">Net</th><th class="text-right">Growth</th></tr></thead>
            <tbody>
              ${monthlyData.map((m, i) => {
                const prev = i > 0 ? monthlyData[i - 1] : null;
                const growth = prev && prev.income > 0 ? ((m.income - prev.income) / prev.income * 100) : null;
                return `
                  <tr>
                    <td><strong>${m.month}</strong></td>
                    <td class="text-right amount-positive">${fmtCurrency(m.income)}</td>
                    <td class="text-right amount-negative">${fmtCurrency(m.expense)}</td>
                    <td class="text-right" style="font-weight:600;color:${m.net >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtCurrency(m.net)}</td>
                    <td class="text-right">${growth !== null ? `<span style="color:${growth >= 0 ? 'var(--green)' : 'var(--red)'}">${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%</span>` : '—'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    container.appendChild(growthCard);
  }
}

function generateRecommendations(entries, monthlyData, catData, totalIncome, totalExpense, burnRate) {
  const recs = [];

  if (burnRate > 0) {
    recs.push({
      icon: '🔴',
      title: 'Reduce burn rate',
      desc: `Cut expenses by ${fmtCurrency(burnRate)}/month to reach breakeven`
    });
  }

  if (catData.length > 0) {
    const topCat = catData[0];
    const pct = totalExpense > 0 ? (topCat.amount / totalExpense * 100) : 0;
    if (pct > 30) {
      recs.push({
        icon: '📊',
        title: `Review "${topCat.category}" spending`,
        desc: `This category accounts for ${pct.toFixed(0)}% of total expenses`
      });
    }
  }

  if (totalIncome > totalExpense) {
    recs.push({
      icon: '💰',
      title: 'Build cash reserves',
      desc: 'Positive cash flow — consider setting aside 20% as buffer'
    });
  }

  if (entries.length > 50 && store.get('channels').length === 0) {
    recs.push({
      icon: '📈',
      title: 'Set up income channels',
      desc: 'Track revenue sources to identify top performers'
    });
  }

  if (monthlyData.length >= 6) {
    const recentIncome = monthlyData.slice(-3).reduce((s, m) => s + m.income, 0) / 3;
    const olderIncome = monthlyData.slice(-6, -3).reduce((s, m) => s + m.income, 0) / 3;
    if (recentIncome > olderIncome * 1.1) {
      recs.push({
        icon: '🚀',
        title: 'Revenue growth detected',
        desc: `Income up ${((recentIncome / olderIncome - 1) * 100).toFixed(0)}% in last 3 months — keep momentum`
      });
    }
  }

  if (recs.length === 0) {
    recs.push({
      icon: '✅',
      title: 'Looking good',
      desc: 'Your finances appear healthy. Keep tracking consistently.'
    });
  }

  return recs.slice(0, 5);
}
