/**
 * theme.js — Gnoke Receipt
 * Apply + toggle dark/light theme.
 * Anti-FOUC script in <head> reads the same key.
 */
const Theme = (() => {
  const KEY = 'gnoke_ledger_theme';

  function apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(KEY, t);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
  }

  function toggle() {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    apply(cur === 'dark' ? 'light' : 'dark');
  }

  // Wire toggle button if present
  document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem(KEY) || 'light';
    apply(saved);
    document.getElementById('theme-toggle')
      ?.addEventListener('click', toggle);
  });

  return { apply, toggle };
})();
