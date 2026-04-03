/**
 * ui.js — Gnoke Ledger
 * Toast · Drawer · Status chip · Loading overlay
 */

/* ── Toast ─────────────────────────────────────────────────────── */
function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `show ${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ── Status chip ────────────────────────────────────────────────── */
function statusChip(text, ms = 2000) {
  const el = document.getElementById('status-chip');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms);
}

/* ── Loading overlay ────────────────────────────────────────────── */
function setLoading(show) {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = show ? 'flex' : 'none';
}

/* ── Drawer ─────────────────────────────────────────────────────── */
const Drawer = (() => {
  const panel   = () => document.getElementById('drawer');
  const overlay = () => document.getElementById('drawer-overlay');

  function open() {
    panel()?.classList.add('open');
    overlay()?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    panel()?.classList.remove('open');
    overlay()?.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });

  return { open, close };
})();
