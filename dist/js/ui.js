/* ============================================
   UI Components — Toast, Modal, Skeleton
   ============================================ */

import { el, icon } from './utils.js';

// --- Toast System ---
let toastContainer = null;

export function initToastContainer() {
  toastContainer = el('div', { className: 'toast-container', id: 'toast-container' });
  document.body.appendChild(toastContainer);
}

export function showToast(message, type = 'info', duration = 4000) {
  if (!toastContainer) initToastContainer();

  const toast = el('div', { className: `toast ${type}` }, [
    el('span', { textContent: message }),
    el('button', {
      className: 'toast-close',
      innerHTML: '&times;',
      onClick: () => removeToast(toast)
    })
  ]);

  toastContainer.appendChild(toast);
  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }
  return toast;
}

function removeToast(toast) {
  if (!toast.parentNode) return;
  toast.style.animation = 'toastOut 0.3s ease forwards';
  setTimeout(() => toast.remove(), 300);
}

// --- Modal System ---
export function showModal(options = {}) {
  const {
    title = '',
    content = '',
    footer = null,
    className = '',
    onClose = null
  } = options;

  const overlay = el('div', { className: 'modal-overlay' });
  const modal = el('div', { className: `modal ${className}` });

  // Header
  const header = el('div', { className: 'modal-header' }, [
    el('h3', { textContent: title }),
    el('button', {
      className: 'btn btn-ghost btn-icon',
      onClick: () => closeModal(overlay, onClose)
    })
  ]);
  header.querySelector('button').appendChild(icon('close'));
  modal.appendChild(header);

  // Body
  const body = el('div', { className: 'modal-body' });
  if (typeof content === 'string') body.innerHTML = content;
  else if (content instanceof Node) body.appendChild(content);
  modal.appendChild(body);

  // Footer
  if (footer) {
    const foot = el('div', { className: 'modal-footer' });
    if (typeof footer === 'function') footer(foot, () => closeModal(overlay, onClose));
    else if (footer instanceof Node) foot.appendChild(footer);
    modal.appendChild(foot);
  }

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(overlay, onClose);
  });

  // ESC to close
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal(overlay, onClose);
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Animate in
  requestAnimationFrame(() => overlay.classList.add('active'));

  return { overlay, modal, body, close: () => closeModal(overlay, onClose) };
}

function closeModal(overlay, onClose) {
  overlay.classList.remove('active');
  setTimeout(() => {
    overlay.remove();
    if (onClose) onClose();
  }, 200);
}

// --- Skeleton Loaders ---
export function skeletonKPI() {
  return `
    <div class="kpi-grid">
      ${Array(4).fill('<div class="kpi-card"><div class="skeleton skeleton-kpi"></div></div>').join('')}
    </div>
  `;
}

export function skeletonChart() {
  return `<div class="card"><div class="card-body"><div class="skeleton skeleton-chart"></div></div></div>`;
}

export function skeletonTable(rows = 5) {
  return `
    <div class="card">
      <div class="card-body">
        ${Array(rows).fill(`
          <div style="display:flex;gap:12px;margin-bottom:12px">
            <div class="skeleton" style="height:14px;width:15%"></div>
            <div class="skeleton" style="height:14px;width:20%"></div>
            <div class="skeleton" style="height:14px;width:25%"></div>
            <div class="skeleton" style="height:14px;width:15%"></div>
            <div class="skeleton" style="height:14px;width:10%"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// --- Confirm Dialog ---
export function showConfirm(message, onConfirm) {
  const body = el('div');
  body.innerHTML = `<p style="font-size:14px;color:var(--text-primary);line-height:1.6">${message}</p>`;

  return showModal({
    title: 'Confirm',
    content: body,
    footer: (foot, close) => {
      foot.appendChild(el('button', {
        className: 'btn btn-secondary',
        textContent: 'Cancel',
        onClick: close
      }));
      foot.appendChild(el('button', {
        className: 'btn btn-primary',
        textContent: 'Confirm',
        onClick: () => { onConfirm(); close(); }
      }));
    }
  });
}

// --- Empty State ---
export function emptyState(iconName, title, subtitle) {
  const div = el('div', { className: 'empty-state' });
  div.appendChild(icon(iconName));
  div.appendChild(el('h4', { textContent: title }));
  div.appendChild(el('p', { textContent: subtitle }));
  return div;
}
