// The visitor's choices from the accessibility menu.
//
// Each choice is a class on <html>, styled at the end of index.css, so the
// whole page follows without any component knowing about it. They are kept in
// localStorage and applied in main.jsx before the first paint, so a visitor
// who asked for large text does not see the page small for a moment on every
// visit.

export const A11Y_KEY = 'jl_a11y';

// Text size steps, applied as zoom on the body so text written in pixels grows
// along with text written in rem.
export const TEXT_STEPS = [1, 1.15, 1.3];

export const DEFAULT_PREFS = {
  text: 0,
  contrast: false,
  grayscale: false,
  links: false,
  headings: false,
  readableFont: false,
  spacing: false,
  noMotion: false,
  bigCursor: false,
};

const CLASSES = {
  links: 'a11y-links',
  headings: 'a11y-headings',
  readableFont: 'a11y-font',
  spacing: 'a11y-spacing',
  noMotion: 'a11y-no-motion',
  bigCursor: 'a11y-cursor',
  contrast: 'a11y-contrast',
};

export function loadPrefs() {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(A11Y_KEY) || '{}') };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(A11Y_KEY, JSON.stringify(prefs));
  } catch { /* private mode - the choices last until the tab is closed */ }
}

export const isDefault = (prefs) => Object.keys(DEFAULT_PREFS).every(key => prefs[key] === DEFAULT_PREFS[key]);

export function applyPrefs(prefs) {
  const root = document.documentElement;
  Object.entries(CLASSES).forEach(([key, cls]) => root.classList.toggle(cls, !!prefs[key]));

  const scale = TEXT_STEPS[prefs.text] || 1;
  root.style.setProperty('--a11y-zoom', String(scale));
  root.classList.toggle('a11y-zoom', scale !== 1);

  // On the root element a filter does not trap fixed-position elements (the
  // header, drawers, this menu), which it would on any other element.
  const filters = [prefs.contrast && 'contrast(1.2)', prefs.grayscale && 'grayscale(1)'].filter(Boolean);
  root.style.filter = filters.join(' ');
}
