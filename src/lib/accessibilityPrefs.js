// The visitor's choices from the accessibility menu.
//
// Each choice becomes a class on <html> (styled at the end of index.css), an
// inline filter on <html>, or a zoom on the body, so the whole page follows
// without any component knowing about it. Choices with several levels cycle
// through them and back to off. They are kept in localStorage and applied in
// main.jsx before the first paint, so a visitor who asked for large text does
// not see the page small for a moment on every visit.

export const A11Y_KEY = 'jl_a11y';
export const A11Y_HIDDEN_KEY = 'jl_a11y_hidden';
export const OPEN_A11Y_EVENT = 'open_a11y_menu';

// Zoom on the body, so text written in pixels grows along with text in rem.
export const TEXT_STEPS = [1, 1.1, 1.2, 1.35];

export const LEVELS = {
  contrast: ['ניגודיות גבוהה', 'מצב כהה', 'מצב בהיר'],
  text: ['110%', '120%', '135%'],
  spacing: ['ריווח קל', 'ריווח בינוני', 'ריווח רחב'],
  lineHeight: ['גובה שורה 1.5', 'גובה שורה 1.8', 'גובה שורה 2'],
  align: ['יישור לימין', 'יישור למרכז', 'יישור לשמאל', 'יישור מלא'],
  saturation: ['רוויה נמוכה', 'רוויה גבוהה', 'שחור-לבן'],
  cursor: ['סמן גדול', 'מדריך קריאה', 'מסכת קריאה'],
};

export const DEFAULT_PREFS = {
  contrast: 0,
  saturation: 0,
  text: 0,
  spacing: 0,
  lineHeight: 0,
  align: 0,
  cursor: 0,
  links: false,
  headings: false,
  noMotion: false,
  hideImages: false,
  dyslexia: false,
  tooltips: false,
  bigWidget: false,
  side: 'left',
};

// Keys that change the page, as opposed to how the menu itself looks.
const PAGE_KEYS = Object.keys(DEFAULT_PREFS).filter(key => key !== 'bigWidget' && key !== 'side');

// The first version of the menu stored booleans and a two-step text size.
function migrate(saved) {
  const p = { ...saved };
  if (typeof p.contrast === 'boolean') p.contrast = p.contrast ? 1 : 0;
  if (p.grayscale === true && !p.saturation) p.saturation = 3;
  if (p.readableFont === true) p.dyslexia = true;
  if (p.bigCursor === true && !p.cursor) p.cursor = 1;
  if (p.spacing === true) p.spacing = 2;
  delete p.grayscale; delete p.readableFont; delete p.bigCursor;
  return p;
}

export function loadPrefs() {
  try {
    const saved = migrate(JSON.parse(localStorage.getItem(A11Y_KEY) || '{}'));
    const prefs = { ...DEFAULT_PREFS };
    Object.keys(DEFAULT_PREFS).forEach(key => {
      if (typeof saved[key] === typeof DEFAULT_PREFS[key]) prefs[key] = saved[key];
    });
    return prefs;
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(A11Y_KEY, JSON.stringify(prefs));
  } catch { /* private mode - the choices last until the tab is closed */ }
}

export const pageIsDefault = (prefs) => PAGE_KEYS.every(key => prefs[key] === DEFAULT_PREFS[key]);

export const resetPage = (prefs) => ({ ...DEFAULT_PREFS, bigWidget: prefs.bigWidget, side: prefs.side });

const TOGGLE_CLASSES = {
  links: 'a11y-links',
  headings: 'a11y-headings',
  noMotion: 'a11y-no-motion',
  hideImages: 'a11y-hide-images',
  dyslexia: 'a11y-dyslexia',
};

const LEVEL_CLASSES = {
  contrast: [null, 'a11y-contrast-high', 'a11y-contrast-dark', 'a11y-contrast-light'],
  spacing: [null, 'a11y-spacing-1', 'a11y-spacing-2', 'a11y-spacing-3'],
  lineHeight: [null, 'a11y-lh-1', 'a11y-lh-2', 'a11y-lh-3'],
  align: [null, 'a11y-align-right', 'a11y-align-center', 'a11y-align-left', 'a11y-align-justify'],
  // Only the large cursor is CSS; the reading guide and mask are drawn by the
  // menu component, which follows the pointer.
  cursor: [null, 'a11y-cursor', null, null],
};

export function applyPrefs(prefs) {
  const root = document.documentElement;

  Object.entries(TOGGLE_CLASSES).forEach(([key, cls]) => root.classList.toggle(cls, !!prefs[key]));
  Object.entries(LEVEL_CLASSES).forEach(([key, classes]) => {
    classes.forEach((cls, level) => { if (cls) root.classList.toggle(cls, prefs[key] === level); });
  });

  const scale = TEXT_STEPS[prefs.text] || 1;
  root.style.setProperty('--a11y-zoom', String(scale));
  root.classList.toggle('a11y-zoom', scale !== 1);

  // On the root element a filter does not trap fixed-position elements (the
  // header, drawers, this menu), which it would on any other element. Dark
  // mode inverts the page here and index.css inverts photos back.
  const filters = [
    prefs.contrast === 1 && 'contrast(1.25)',
    prefs.contrast === 2 && 'invert(1) hue-rotate(180deg)',
    prefs.saturation === 1 && 'saturate(0.5)',
    prefs.saturation === 2 && 'saturate(1.8)',
    prefs.saturation === 3 && 'grayscale(1)',
  ].filter(Boolean);
  root.style.filter = filters.join(' ');
}
