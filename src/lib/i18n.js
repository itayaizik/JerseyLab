// Hebrew or English, chosen from the header and kept in localStorage.
//
// Every piece of text is written in place as t('עברית', 'English'), next to
// the Hebrew it translates, rather than in a separate file of keys: a sentence
// changed in one language is right there beside the other, and a component
// reads the same as before.
//
// Switching reloads the page. The language is read once, when this file
// loads, so module-level lists (the menus, the collections) come out in the
// right language without every component having to re-render on a switch.
// public/theme-init.js sets lang and dir on <html> from the same key before
// the first paint, so an English visitor never sees the page right-to-left.

export const LANG_KEY = 'jl_lang';

function readLang() {
  try { return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'he'; } catch { return 'he'; }
}

export const LANG = typeof window === 'undefined' ? 'he' : readLang();
export const isEn = LANG === 'en';

// The Hebrew when the site is in Hebrew or no English was given (text typed
// into the admin in Hebrew only, say).
export const t = (he, en) => (isEn && en != null && en !== '' ? en : he);

// Text the owner types in the admin (a section title, the about text) is
// Hebrew. The English site uses the saved English version if there is one
// (the same setting with _en), and otherwise the built-in English, never the
// Hebrew in the middle of an English page.
export const tSetting = (settings, key, heDefault, enDefault) => (
  isEn ? (settings?.[`${key}_en`] || enDefault) : (settings?.[key] || heDefault)
);

export function setLang(lang) {
  try { localStorage.setItem(LANG_KEY, lang === 'en' ? 'en' : 'he'); } catch { /* private mode */ }
  window.location.reload();
}
