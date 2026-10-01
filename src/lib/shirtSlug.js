// Readable product URLs.
//
// Shirts used to live at /shirt/6a46d26a1460358ba62d6c5e, which tells a reader
// and a search engine nothing. They live at
// /shirt/חולצת-ברצלונה-בית-רטרו-2010-11-a62d6c5e now: the words people actually
// type, in the language they type them in.
//
// Hebrew on purpose rather than transliteration. Every query this shop gets
// impressions for is in Hebrew, a Hebrew URL is shown decoded and emboldened in
// Google's results, and the catalogue has no English name for most shirts to
// transliterate from anyway.
//
// The eight hex characters on the end are not decoration. Two shirts can share
// a name - the same club, season and cut, listed twice - and a URL that cannot
// say which is which is a URL that cannot be resolved. Deriving it from the id
// rather than from a lookup table means the React app and the build-time
// prerenderer always agree without sharing state.
//
// Deliberately plain ESM with no imports: the build scripts read it in node.

// Everything that is not a letter, a digit or Hebrew becomes a separator. The
// season "2010/11" is the main reason - a slash there would split the path.
export function slugify(text) {
  return String(text || '')
    .trim()
    .replace(/["'’״׳]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

// The last eight hex characters of the id, which is enough to tell apart two
// shirts that are otherwise named identically.
export const shortId = (id) => String(id || '').replace(/-/g, '').slice(-8);

export function shirtSlug(shirt) {
  if (!shirt?.id) return '';
  const words = slugify(shirt.name);
  const tail = shortId(shirt.id);
  return words ? `${words}-${tail}` : tail;
}

export const shirtPath = (shirt) => `/shirt/${shirtSlug(shirt) || shirt?.id || ''}`;

// What to look a URL up by. A slug ends in the eight characters that identify
// the row; a bare id does not, and is fetched directly instead. Returning null
// for an id is the signal to do that.
export function shortIdFromKey(key) {
  const text = String(key || '');
  if (!text.includes('-')) return null;
  const tail = text.split('-').pop();
  return /^[0-9a-f]{8}$/i.test(tail) ? tail.toLowerCase() : null;
}

// The other direction, for the router. A visitor can arrive at either shape:
// the old bare id, from a link sent before this existed or from a search result
// that has not been recrawled, or the new slug. Both have to land on the shirt.
export function findShirtByKey(shirts, key) {
  if (!key) return null;
  const list = shirts || [];
  const exact = list.find(s => s.id === key);
  if (exact) return exact;
  const tail = String(key).split('-').pop();
  if (!/^[0-9a-f]{8}$/i.test(tail)) return null;
  return list.find(s => shortId(s.id) === tail.toLowerCase()) || null;
}

// True when the URL used is not the one this shirt should be at, so the page
// can send the visitor on to the canonical spelling.
export const isCanonicalKey = (shirt, key) => !!shirt && key === shirtSlug(shirt);
