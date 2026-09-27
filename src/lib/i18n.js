// Hebrew or English, chosen from the header and kept in localStorage.
//
// Every piece of text is written in place as t('עברית', 'English'), next to
// the Hebrew it translates, rather than in a separate file of keys: a sentence
// changed in one language is right there beside the other, and a component
// reads the same as before.
//
// The address decides: everything under /en is the English site, everything
// else is Hebrew. That is what lets Google index the two separately - one URL
// that changes language by itself is a page Google only ever sees in Hebrew.
// The saved choice is only used to send a returning visitor to their side of
// the site (public/theme-init.js), which also sets lang and dir before the
// first paint so an English visitor never sees the page right-to-left.
//
// The language is read once, when this file loads, so module-level lists (the
// menus, the collections) come out in the right language without every
// component having to re-render on a switch.

export const LANG_KEY = 'jl_lang';

// Everything the English site is served under. React Router runs with this as
// its basename, so a <Link to="/catalog"> lands on /en/catalog by itself.
export const EN_PREFIX = '/en';

const isEnglishPath = (path) => path === EN_PREFIX || path.startsWith(`${EN_PREFIX}/`);

// The same page on the other side of the site.
export const pathInLang = (path, lang) => {
  const bare = isEnglishPath(path) ? path.slice(EN_PREFIX.length) || '/' : path;
  return lang === 'en' ? (bare === '/' ? EN_PREFIX : EN_PREFIX + bare) : bare;
};

export const LANG = typeof window === 'undefined' || !isEnglishPath(window.location.pathname) ? 'he' : 'en';
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

// Goes to the same page on the other side of the site, which is a real
// navigation rather than a reload: the URL has to change with the language.
export function setLang(lang) {
  const next = lang === 'en' ? 'en' : 'he';
  try { localStorage.setItem(LANG_KEY, next); } catch { /* private mode */ }
  const { pathname, search, hash } = window.location;
  window.location.assign(pathInLang(pathname, next) + search + hash);
}
