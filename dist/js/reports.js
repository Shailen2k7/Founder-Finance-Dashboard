/* ============================================
   Report Download System — CSV, Excel, PDF
   ============================================ */

import { store } from './store.js';
import { fmtCurrency, fmtDate, monthName } from './utils.js';
import { showToast, showModal } from './ui.js';
import { el } from './utils.js';

// --- Export Filtered Data as CSV ---
export function exportCSV(entries, filename = 'transactions.csv') {
  const headers = ['Date', 'Business', 'Account', 'Type', 'Category', 'Description', 'Amount'];
  const rows = entries.map(e => [
    e.date,
    csvEscape(e.business),
    csvEscape(e.account),
    e.type,
    csvEscape(e.category),
    csvEscape(e.description),
    parseFloat(e.amount).toFixed(2)
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csv, filename, 'text/csv;charset=utf-8;');
  showToast('CSV exported successfully', 'success');
}

function csvEscape(val) {
  const str = String(val || '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// --- Export as Excel ---
export async function exportExcel(entries, filename = 'transactions.xlsx') {
  try {
    // Load SheetJS
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
      document.head.appendChild(script);
      await new Promise((res, rej) => { script.onload = res; script.onerror = rej; });
    }

    const XLSX = window.XLSX;
    const wb = XLSX.utils.book_new();

    // Transactions sheet
    const data = entries.map(e => ({
      Date: e.date,
      Business: e.business,
      Account: e.account,
      Type: e.type,
      Category: e.category,
      Description: e.description,
      Amount: parseFloat(e.amount) || 0
    }));
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 10 },
      { wch: 18 }, { wch: 30 }, { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    // Summary sheet
    const totalIncome = entries.filter(e => e.type === 'Income').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const totalExpense = entries.filter(e => e.type === 'Expense').reduce((s, e) => s + Math.abs(parseFloat(e.amount) || 0), 0);

    const summary = [
      { Metric: 'Total Income', Value: totalIncome },
      { Metric: 'Total Expenses', Value: totalExpense },
      { Metric: 'Net Cash Flow', Value: totalIncome - totalExpense },
      { Metric: 'Total Transactions', Value: entries.length },
      { Metric: 'Date Range', Value: `${entries[entries.length - 1]?.date || ''} to ${entries[0]?.date || ''}` }
    ];
    const ws2 = XLSX.utils.json_to_sheet(summary);
    ws2['!cols'] = [{ wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

    // Category breakdown sheet
    const cats = {};
    for (const e of entries) {
      if (e.type !== 'Expense') continue;
      cats[e.category] = (cats[e.category] || 0) + Math.abs(parseFloat(e.amount) || 0);
    }
    const catData = Object.entries(cats)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => ({
        Category: category,
        Amount: amount,
        Percentage: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) + '%' : '0%'
      }));
    const ws3 = XLSX.utils.json_to_sheet(catData);
    ws3['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Categories');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    downloadBlob(buf, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    showToast('Excel report exported', 'success');
  } catch (err) {
    showToast('Failed to export Excel: ' + err.message, 'error');
  }
}

// --- Export as PDF ---
export async function exportPDF(entries, filename = 'report.pdf') {
  try {
    // Load jsPDF
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js';
      document.head.appendChild(script);
      await new Promise((res, rej) => { script.onload = res; script.onerror = rej; });
    }

    // Load autoTable plugin
    if (!window.jspdf.jsPDF.prototype.autoTable) {
      const script2 = document.createElement('script');
      script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js';
      document.head.appendChild(script2);
      await new Promise((res, rej) => { script2.onload = res; script2.onerror = rej; });
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const totalIncome = entries.filter(e => e.type === 'Income').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const totalExpense = entries.filter(e => e.type === 'Expense').reduce((s, e) => s + Math.abs(parseFloat(e.amount) || 0), 0);
    const netCashFlow = totalIncome - totalExpense;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Founder Finance Report', 14, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}  |  ${entries.length} transactions`, 14, 25);
    doc.setTextColor(0);

    // Summary boxes
    let y = 34;
    const summaryData = [
      ['Total Income', fmtCurrency(totalIncome)],
      ['Total Expenses', fmtCurrency(totalExpense)],
      ['Net Cash Flow', fmtCurrency(netCashFlow)]
    ];

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, y);
    y += 6;

    doc.autoTable({
      startY: y,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 }
    });

    // Category breakdown
    y = doc.lastAutoTable.finalY + 10;
    const cats = {};
    for (const e of entries) {
      if (e.type !== 'Expense') continue;
      cats[e.category] = (cats[e.category] || 0) + Math.abs(parseFloat(e.amount) || 0);
    }
    const catRows = Object.entries(cats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([cat, amt]) => [cat, fmtCurrency(amt), totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(1) + '%' : '0%']);

    if (catRows.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Expense Categories (Top 10)', 14, y);
      y += 6;

      doc.autoTable({
        startY: y,
        head: [['Category', 'Amount', '% of Total']],
        body: catRows,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
        margin: { left: 14, right: 14 }
      });
    }

    // Transaction table (limit to 100 most recent)
    doc.addPage();
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Transactions', 14, 18);

    const txRows = entries.slice(0, 100).map(e => [
      e.date,
      e.business,
      e.account,
      e.type,
      e.category,
      (e.description || '').slice(0, 40),
      (e.type === 'Income' ? '' : '-') + parseFloat(e.amount).toFixed(2)
    ]);

    doc.autoTable({
      startY: 24,
      head: [['Date', 'Business', 'Account', 'Type', 'Category', 'Description', 'Amount']],
      body: txRows,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: { 6: { halign: 'right' } },
      margin: { left: 14, right: 14 }
    });

    doc.save(filename);
    showToast('PDF report exported', 'success');
  } catch (err) {
    showToast('Failed to export PDF: ' + err.message, 'error');
  }
}

// --- Helper: Download blob ---
function downloadBlob(content, filename, mimeType) {
  const blob = content instanceof ArrayBuffer
    ? new Blob([content], { type: mimeType })
    : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// --- Export Menu UI ---
export function showExportMenu(entries) {
  const content = el('div');
  content.innerHTML = `
    <p class="text-sm text-muted mb-4">Export ${entries.length} transactions with summary metrics.</p>
    <div style="display:flex;flex-direction:column;gap:10px">
      <button class="btn btn-secondary w-full" id="export-csv" style="justify-content:flex-start;padding:14px 18px">
        <span style="font-size:20px;margin-right:8px">📄</span>
        <div style="text-align:left">
          <strong>CSV</strong>
          <p class="text-xs text-muted mt-1">Comma-separated values — opens in any spreadsheet app</p>
        </div>
      </button>
      <button class="btn btn-secondary w-full" id="export-excel" style="justify-content:flex-start;padding:14px 18px">
        <span style="font-size:20px;margin-right:8px">📊</span>
        <div style="text-align:left">
          <strong>Excel (.xlsx)</strong>
          <p class="text-xs text-muted mt-1">Multi-sheet workbook with summary and categories</p>
        </div>
      </button>
      <button class="btn btn-secondary w-full" id="export-pdf" style="justify-content:flex-start;padding:14px 18px">
        <span style="font-size:20px;margin-right:8px">📑</span>
        <div style="text-align:left">
          <strong>PDF Report</strong>
          <p class="text-xs text-muted mt-1">Formatted summary report with charts and tables</p>
        </div>
      </button>
    </div>
  `;

  const { close } = showModal({
    title: 'Export Report',
    content,
    onClose: null
  });

  content.querySelector('#export-csv').addEventListener('click', () => { exportCSV(entries); close(); });
  content.querySelector('#export-excel').addEventListener('click', () => { exportExcel(entries); close(); });
  content.querySelector('#export-pdf').addEventListener('click', () => { exportPDF(entries); close(); });
}
