/* ============================================
   Founder Finance Dashboard — Main App
   ============================================ */

import { store } from './store.js';
import { el, icon } from './utils.js';
import { initToastContainer, showModal, showToast } from './ui.js';
import { initSupabase, configureSupabase, refreshData } from './supabase.js';
import { showExportMenu } from './reports.js';
import { createUploadZone } from './upload.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderEntries } from './pages/entries.js';
import { renderAccounts } from './pages/accounts.js';
import { renderChannels } from './pages/channels.js';
import { renderInsights } from './pages/insights.js';

// --- Navigation Config ---
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'accounts', label: 'Accounts', icon: 'accounts' },
  { id: 'channels', label: 'Channels', icon: 'channels' },
  { id: 'entries', label: 'All Entries', icon: 'entries' },
  { id: 'insights', label: 'Insights', icon: 'insights' }
];

// --- Page Renderers ---
const PAGE_RENDERERS = {
  dashboard: renderDashboard,
  entries: renderEntries,
  accounts: renderAccounts,
  channels: renderChannels,
  insights: renderInsights
};

// --- Build App Shell ---
function buildApp() {
  const root = document.getElementById('root');
  root.innerHTML = '';
  root.className = 'app-layout';

  // Sidebar overlay (mobile)
  const overlay = el('div', { className: 'sidebar-overlay', id: 'sidebar-overlay' });
  overlay.addEventListener('click', () => toggleSidebar(false));
  root.appendChild(overlay);

  // Sidebar
  const sidebar = el('aside', { className: 'sidebar', id: 'sidebar' });
  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <h1>Founder Finance</h1>
      <span>Multi-business Dashboard</span>
    </div>
    <nav class="sidebar-nav" id="sidebar-nav">
      <div class="nav-section-label">Menu</div>
    </nav>
    <div class="sidebar-footer">
      <div class="connection-status" id="connection-status">
        <span class="connection-dot pending" id="connection-dot"></span>
        <span id="connection-text">Connecting...</span>
      </div>
      <button class="btn btn-ghost btn-sm w-full mt-2" id="settings-btn" style="justify-content:flex-start;color:var(--text-sidebar)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
        <span>Settings</span>
      </button>
    </div>
  `;
  root.appendChild(sidebar);

  // Build nav items
  const nav = sidebar.querySelector('#sidebar-nav');
  for (const item of NAV_ITEMS) {
    const btn = el('button', {
      className: `nav-item ${item.id === store.get('page') ? 'active' : ''}`,
      dataset: { page: item.id }
    });
    btn.appendChild(icon(item.icon));
    btn.appendChild(el('span', { textContent: item.label }));
    btn.addEventListener('click', () => navigateTo(item.id));
    nav.appendChild(btn);
  }

  // Settings button
  sidebar.querySelector('#settings-btn').addEventListener('click', showSettingsModal);

  // Main content
  const main = el('main', { className: 'main-content' });

  // Top bar
  const topBar = el('div', { className: 'top-bar' });
  topBar.innerHTML = `
    <div class="top-bar-left">
      <button class="mobile-menu-btn" id="mobile-menu-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <h2 id="page-title">Dashboard</h2>
    </div>
    <div class="top-bar-right">
      <button class="btn btn-primary btn-sm" id="top-upload-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
        Upload
      </button>
      <button class="btn btn-secondary btn-sm" id="top-export-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        Export
      </button>
      <button class="btn btn-ghost btn-icon btn-sm" id="top-refresh-btn" title="Refresh data">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
      </button>
    </div>
  `;
  main.appendChild(topBar);

  // Page content container
  const pageContent = el('div', { className: 'page-content', id: 'page-content' });
  main.appendChild(pageContent);

  root.appendChild(main);

  // Wire up top bar buttons
  document.getElementById('mobile-menu-btn').addEventListener('click', () => toggleSidebar(true));
  document.getElementById('top-upload-btn').addEventListener('click', showTopUploadModal);
  document.getElementById('top-export-btn').addEventListener('click', () => showExportMenu(store.filteredEntries));
  document.getElementById('top-refresh-btn').addEventListener('click', async () => {
    await refreshData();
    renderCurrentPage();
    showToast('Data refreshed', 'info');
  });

  // Initial render
  renderCurrentPage();
}

function toggleSidebar(open) {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (open) {
    sidebar.classList.add('open');
    overlay.classList.add('active');
  } else {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }
}

function navigateTo(page) {
  store.set({ page });
  renderCurrentPage();

  // Update active nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  // Update title
  const item = NAV_ITEMS.find(n => n.id === page);
  const titleEl = document.getElementById('page-title');
  if (titleEl && item) titleEl.textContent = item.label;

  // Close mobile sidebar
  toggleSidebar(false);
}

function renderCurrentPage() {
  const page = store.get('page');
  const container = document.getElementById('page-content');
  if (!container) return;

  const renderer = PAGE_RENDERERS[page];
  if (renderer) renderer(container);
}

function showTopUploadModal() {
  const content = el('div');
  createUploadZone(content);

  showModal({
    title: 'Upload Transactions',
    content,
    className: 'modal-lg'
  });
}

function showSettingsModal() {
  const url = localStorage.getItem('ffd_supabase_url') || '';
  const key = localStorage.getItem('ffd_supabase_key') || '';

  const content = el('div');
  content.innerHTML = `
    <p class="text-sm text-muted mb-4">Connect to your Supabase project for persistent storage and real-time sync.</p>
    <div class="form-group">
      <label class="form-label">Supabase URL</label>
      <input class="form-input" id="sb-url" value="${url}" placeholder="https://xxxxx.supabase.co">
    </div>
    <div class="form-group">
      <label class="form-label">Supabase Anon Key</label>
      <input class="form-input" id="sb-key" value="${key}" placeholder="eyJhbGciOiJIUzI1NiI..." type="password">
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <div class="flex items-center gap-2">
        <span class="connection-dot ${store.get('supabaseConnected') ? '' : 'disconnected'}"></span>
        <span class="text-sm">${store.get('supabaseConnected') ? 'Connected' : 'Not connected — using local storage'}</span>
      </div>
    </div>
    <div style="background:var(--bg-input);border-radius:var(--radius-md);padding:12px 16px;margin-top:8px">
      <p class="text-xs text-muted"><strong>Setup:</strong> Run the SQL in <code>setup.sql</code> in your Supabase SQL Editor first, then enter your credentials above.</p>
    </div>
  `;

  showModal({
    title: 'Database Settings',
    content,
    footer: (foot, closeFn) => {
      foot.appendChild(el('button', { className: 'btn btn-secondary', textContent: 'Cancel', onClick: closeFn }));
      foot.appendChild(el('button', {
        className: 'btn btn-primary',
        textContent: 'Connect',
        onClick: async () => {
          const newUrl = document.getElementById('sb-url').value;
          const newKey = document.getElementById('sb-key').value;
          if (!newUrl || !newKey) {
            showToast('Both URL and Key are required', 'error');
            return;
          }
          configureSupabase(newUrl, newKey);
          closeFn();
          showToast('Connecting to Supabase...', 'info');
          const success = await initSupabase();
          updateConnectionStatus();
          renderCurrentPage();
          if (success) showToast('Connected to Supabase!', 'success');
        }
      }));
    }
  });
}

function updateConnectionStatus() {
  const dot = document.getElementById('connection-dot');
  const text = document.getElementById('connection-text');
  if (!dot || !text) return;

  const connected = store.get('supabaseConnected');
  dot.className = `connection-dot ${connected ? '' : 'disconnected'}`;
  text.textContent = connected ? 'Supabase connected' : 'Local storage mode';
}

// --- Auto-sync: re-render on data changes ---
store.on('entries', () => {
  renderCurrentPage();
});
store.on('channels', () => {
  if (store.get('page') === 'channels') renderCurrentPage();
});

// --- Init ---
async function init() {
  initToastContainer();
  buildApp();

  // Connect to Supabase
  await initSupabase();
  updateConnectionStatus();
  renderCurrentPage();
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
