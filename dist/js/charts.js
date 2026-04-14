/* ============================================
   Chart Rendering — Using Chart.js
   ============================================ */

let chartJsLoaded = false;
const chartInstances = {};

// Load Chart.js from CDN
export async function loadChartJs() {
  if (chartJsLoaded) return;
  if (window.Chart) { chartJsLoaded = true; return; }

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js';
  document.head.appendChild(script);
  await new Promise((res, rej) => { script.onload = res; script.onerror = rej; });
  chartJsLoaded = true;
}

// Destroy existing chart instance
function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

// --- Monthly Cash Flow Bar Chart ---
export function renderCashFlowChart(canvasId, monthlyData) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  chartInstances[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: monthlyData.map(d => d.month),
      datasets: [
        {
          label: 'Income',
          data: monthlyData.map(d => d.income),
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderColor: '#10B981',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.7
        },
        {
          label: 'Expenses',
          data: monthlyData.map(d => d.expense),
          backgroundColor: 'rgba(239, 68, 68, 0.75)',
          borderColor: '#EF4444',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 11 } }
        },
        tooltip: {
          backgroundColor: '#1E1F2B',
          titleFont: { size: 12 },
          bodyFont: { size: 11 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${fmtShort(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#9CA3AF' }
        },
        y: {
          grid: { color: '#F3F4F6' },
          ticks: { font: { size: 10 }, color: '#9CA3AF', callback: (v) => fmtShort(v) }
        }
      }
    }
  });
}

// --- Monthly Trend Line Chart ---
export function renderTrendChart(canvasId, monthlyData) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  chartInstances[canvasId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: monthlyData.map(d => d.month),
      datasets: [
        {
          label: 'Income',
          data: monthlyData.map(d => d.income),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Expenses',
          data: monthlyData.map(d => d.expense),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Net',
          data: monthlyData.map(d => d.net),
          borderColor: '#6366F1',
          borderDash: [5, 5],
          backgroundColor: 'transparent',
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 11 } }
        },
        tooltip: {
          backgroundColor: '#1E1F2B',
          titleFont: { size: 12 },
          bodyFont: { size: 11 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${fmtShort(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#9CA3AF' }
        },
        y: {
          grid: { color: '#F3F4F6' },
          ticks: { font: { size: 10 }, color: '#9CA3AF', callback: (v) => fmtShort(v) }
        }
      }
    }
  });
}

// --- Expense Category Pie/Doughnut Chart ---
export function renderCategoryChart(canvasId, categoryData) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const colors = [
    '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6',
    '#8B5CF6', '#EF4444', '#14B8A6', '#F97316', '#06B6D4',
    '#84CC16', '#D946EF'
  ];

  chartInstances[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: categoryData.map(d => d.category),
      datasets: [{
        data: categoryData.map(d => d.amount),
        backgroundColor: categoryData.map((_, i) => colors[i % colors.length]),
        borderWidth: 2,
        borderColor: '#FFFFFF',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'right',
          labels: { usePointStyle: true, pointStyle: 'circle', padding: 10, font: { size: 11 } }
        },
        tooltip: {
          backgroundColor: '#1E1F2B',
          titleFont: { size: 12 },
          bodyFont: { size: 11 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
              return `${ctx.label}: ${fmtShort(ctx.raw)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

function fmtShort(val) {
  const n = parseFloat(val) || 0;
  if (Math.abs(n) >= 1e6) return '\u00A3' + (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return '\u00A3' + (n / 1e3).toFixed(1) + 'K';
  return '\u00A3' + n.toFixed(0);
}

// Destroy all chart instances (for cleanup)
export function destroyAllCharts() {
  for (const id of Object.keys(chartInstances)) {
    destroyChart(id);
  }
}
