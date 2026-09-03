import counts from './catalogFacets.json';

// Whether a category link has anything behind it.
//
// Four links in the navigation pointed at an empty catalogue - ילדים, שחקנים,
// סייל and NBA - because every shirt is a men's football shirt with no player
// name and no sale price. Tapping one got a customer nothing.
//
// The counts are measured at build time (scripts/generate-facets.mjs), so this
// costs nothing to call while rendering. A category comes back on its own as
// soon as there is stock behind it and the site is rebuilt.

// A `?key=value` pair from a catalogue link, e.g. "gender=kids".
export function facetCount(query) {
  const value = counts[query];
  // Unknown key, or a build with no catalogue data: assume it has stock rather
  // than hiding a link that might be fine.
  return value === undefined ? null : value;
}

export function hasStock(query) {
  const value = facetCount(query);
  return value === null ? true : value > 0;
}

// Keeps only the entries whose href leads somewhere. Takes the href off each
// item so every menu can use the same rule.
export function withStock(items, getHref = (item) => item.href) {
  return items.filter(item => {
    const href = getHref(item);
    if (!href || !href.includes('?')) return true;
    const query = href.split('?')[1];
    return hasStock(query);
  });
}
