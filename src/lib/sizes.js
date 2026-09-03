// Size labels come from two eras of data entry: the admin forms write 'XXL',
// while shirts imported from Base44 store the same size as '2XL' (178 shirts in
// production: 168 'XXL', 17 '2XL'). Anything that reads a size - a selector, a
// stock lookup, a filter - has to treat the two as the same size, otherwise the
// size silently disappears or reports no local stock.
//
// '2XL' is the canonical label; the aliases are only ever used for lookups.

export const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '6-7Y', '8-9Y', '10-11Y', '12-13Y', '14-15Y'];

const ALIASES = { XXL: '2XL', XXXL: '3XL' };

export function normalizeSize(size) {
  if (!size) return size;
  const s = String(size).trim().toUpperCase();
  return ALIASES[s] || s;
}

// Every spelling a given size may be stored under, canonical form first.
export function sizeAliases(size) {
  const canonical = normalizeSize(size);
  const raws = Object.keys(ALIASES).filter(raw => ALIASES[raw] === canonical);
  return [canonical, ...raws];
}

// Reads a quantity out of a { size: qty } map no matter which spelling the row
// was saved with. Returns 0 rather than undefined so callers can just compare.
export function sizeQty(map, size) {
  if (!map || typeof map !== 'object' || !size) return 0;
  for (const key of sizeAliases(size)) {
    const qty = Number(map[key]);
    if (Number.isFinite(qty) && qty > 0) return qty;
  }
  return 0;
}

// Writes a quantity under the canonical key and drops any alias spelling, so a
// row never ends up carrying both 'XXL' and '2XL' for the same size.
export function setSizeQty(map, size, qty) {
  const next = { ...(map || {}) };
  for (const key of sizeAliases(size)) delete next[key];
  const n = Math.max(0, parseInt(qty, 10) || 0);
  if (n > 0) next[normalizeSize(size)] = n;
  return next;
}

export function sortSizes(sizes) {
  return [...sizes].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a), bi = SIZE_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return String(a).localeCompare(String(b));
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

// Distinct, ordered, display-ready sizes for a shirt. Deduping happens after
// normalising, so a row carrying both 'XXL' and '2XL' still yields one chip.
export function shirtSizes(shirt) {
  const raw = shirt?.sizes && typeof shirt.sizes === 'object' ? Object.keys(shirt.sizes) : [];
  return sortSizes([...new Set(raw.map(normalizeSize))]);
}
