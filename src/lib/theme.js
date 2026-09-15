// Light or dark, chosen from the header and kept in localStorage.
//
// The class on <html> is what switches the colours (index.css). It is set
// before the first paint by public/theme-init.js, which reads the same key;
// this file changes it while the page is open.

export const THEME_KEY = 'jl_theme';
const THEME_COLORS = { light: '#FFFFFF', dark: '#0D1422' };

export function getTheme() {
  try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
}

export function setTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  try { localStorage.setItem(THEME_KEY, next); } catch { /* private mode - lasts until the tab closes */ }
  document.documentElement.classList.toggle('dark', next === 'dark');
  // The browser's own bar on phones follows too.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[next]);
  window.dispatchEvent(new Event('theme_changed'));
}
