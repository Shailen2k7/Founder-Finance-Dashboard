/* ============================================
   Channels Page — Income Sources
   ============================================ */

import { store } from '../store.js';
import { fmtCurrency, el, icon, escHtml } from '../utils.js';
import { showModal, showConfirm, showToast, emptyState } from '../ui.js';
import { insertChannel, updateChannel, deleteChannel } from '../supabase.js';

const COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];

export function renderChannels(container) {
  const channels = store.get('channels');
  const entries = store.get('entries');
  container.innerHTML = '';

  // --- Header ---
  const header = el('div', { className: 'flex items-center justify-between mb-4 fade-in' });
  header.innerHTML = `<div></div>`;
  const addBtn = el('button', { className: 'btn btn-primary', onClick: () => showChannelModal() });
  addBtn.appendChild(icon('plus'));
  addBtn.appendChild(document.createTextNode(' Add Channel'));
  header.appendChild(addBtn);
  container.appendChild(header);

  if (channels.length === 0) {
    container.appendChild(emptyState('channels', 'No channels yet', 'Add income channels to track revenue sources'));
    return;
  }

  // --- Channel Cards ---
  const grid = el('div', { className: 'grid-3 fade-in' });
  for (const ch of channels) {
    const clr = ch.clr || COLORS[0];
    const bg = ch.bg || clr + '15';
    const cats = Array.isArray(ch.cats) ? ch.cats : [];

    // Calculate revenue for this channel
    const channelIncome = entries
      .filter(e => e.type === 'Income' && cats.some(c =>
        e.category?.toLowerCase() === c.toLowerCase()
      ))
      .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

    const card = el('div', { className: 'card' });
    card.innerHTML = `
      <div class="card-body">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div style="width:10px;height:10px;border-radius:50%;background:${clr}"></div>
            <strong style="font-size:14px">${escHtml(ch.name)}</strong>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-icon btn-sm edit-ch" data-id="${ch.id}" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button class="btn btn-ghost btn-icon btn-sm del-ch" data-id="${ch.id}" title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
        ${ch.biz ? `<p class="text-sm text-muted mb-2">Business: ${escHtml(ch.biz)}</p>` : ''}
        <div class="kpi-value" style="font-size:22px;color:${clr}">${fmtCurrency(channelIncome)}</div>
        <div class="mt-2 flex flex-wrap gap-2">
          ${cats.map(c => `<span class="channel-tag" style="background:${bg};color:${clr}"><span class="channel-dot" style="background:${clr}"></span>${escHtml(c)}</span>`).join('')}
          ${cats.length === 0 ? '<span class="text-xs text-muted">No categories linked</span>' : ''}
        </div>
      </div>
    `;
    grid.appendChild(card);
  }
  container.appendChild(grid);

  // Event delegation
  grid.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-ch');
    const delBtn = e.target.closest('.del-ch');
    if (editBtn) {
      const ch = channels.find(c => String(c.id) === editBtn.dataset.id);
      if (ch) showChannelModal(ch);
    }
    if (delBtn) {
      showConfirm('Delete this channel?', async () => {
        const { error } = await deleteChannel(parseInt(delBtn.dataset.id));
        if (error) showToast('Delete failed', 'error');
        else {
          showToast('Channel deleted', 'success');
          renderChannels(container);
        }
      });
    }
  });

  // --- Income by Category Table ---
  const incomeEntries = entries.filter(e => e.type === 'Income');
  const catMap = {};
  for (const e of incomeEntries) {
    catMap[e.category] = (catMap[e.category] || 0) + (parseFloat(e.amount) || 0);
  }
  const catData = Object.entries(catMap).sort(([, a], [, b]) => b - a);

  if (catData.length > 0) {
    const tableCard = el('div', { className: 'card mt-4 fade-in' });
    tableCard.innerHTML = `
      <div class="card-header"><h3>Income by Category</h3></div>
      <div class="card-body" style="padding:0">
        <div class="table-container">
          <table>
            <thead><tr><th>Category</th><th class="text-right">Amount</th><th>Channel</th></tr></thead>
            <tbody>
              ${catData.map(([cat, amt]) => {
                const ch = channels.find(c => (c.cats || []).some(cc => cc.toLowerCase() === cat.toLowerCase()));
                return `
                  <tr>
                    <td><strong>${escHtml(cat)}</strong></td>
                    <td class="text-right amount-positive">${fmtCurrency(amt)}</td>
                    <td>${ch ? `<span class="channel-tag" style="background:${(ch.bg || '#EEF2FF')};color:${(ch.clr || '#6366F1')}"><span class="channel-dot" style="background:${ch.clr || '#6366F1'}"></span>${escHtml(ch.name)}</span>` : '<span class="text-muted text-xs">Unlinked</span>'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    container.appendChild(tableCard);
  }
}

function showChannelModal(existing = null) {
  const isEdit = !!existing;
  const content = el('div');
  content.innerHTML = `
    <div class="form-group">
      <label class="form-label">Channel Name</label>
      <input class="form-input" id="ch-name" value="${existing?.name || ''}" placeholder="e.g., Amazon FBA">
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label class="form-label">Business</label>
        <input class="form-input" id="ch-biz" value="${existing?.biz || ''}" placeholder="e.g., Nutrolis">
      </div>
      <div class="form-group">
        <label class="form-label">Color</label>
        <input class="form-input" type="color" id="ch-color" value="${existing?.clr || COLORS[Math.floor(Math.random() * COLORS.length)]}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Categories (comma-separated)</label>
      <input class="form-input" id="ch-cats" value="${(existing?.cats || []).join(', ')}" placeholder="e.g., Sales, Refunds, Subscriptions">
    </div>
  `;

  showModal({
    title: isEdit ? 'Edit Channel' : 'Add Channel',
    content,
    footer: (foot, closeFn) => {
      foot.appendChild(el('button', { className: 'btn btn-secondary', textContent: 'Cancel', onClick: closeFn }));
      foot.appendChild(el('button', {
        className: 'btn btn-primary',
        textContent: isEdit ? 'Save' : 'Add',
        onClick: async () => {
          const name = document.getElementById('ch-name').value.trim();
          if (!name) { showToast('Name is required', 'error'); return; }
          const data = {
            name,
            biz: document.getElementById('ch-biz').value.trim(),
            clr: document.getElementById('ch-color').value,
            bg: document.getElementById('ch-color').value + '18',
            cats: document.getElementById('ch-cats').value.split(',').map(s => s.trim()).filter(Boolean)
          };

          if (isEdit) {
            const { error } = await updateChannel(existing.id, data);
            if (error) showToast('Update failed', 'error');
            else { showToast('Channel updated', 'success'); closeFn(); }
          } else {
            const { error } = await insertChannel(data);
            if (error) showToast('Failed to add channel', 'error');
            else { showToast('Channel added', 'success'); closeFn(); }
          }
        }
      }));
    }
  });
}
