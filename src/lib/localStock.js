// Local stock: the physical shirts the shop holds in Israel, one entry each.
//
// It used to be a count per size plus one printed name for the whole shirt,
// which cannot describe what a shop actually has on the shelf: two size S
// Barcelona shirts, one printed MESSI 10 and one YAMAL 19, are two different
// things a customer can buy, and the old model could only say "S: 2".
//
// Each item is { id, size, name, number, player_version }. The per-size count
// (local_stock_sizes) and the in-stock flag are derived from the items on
// every save, because the catalogue filter, the shipping badge and the facet
// build only need to know which sizes are in stock - they keep reading the
// summary and never needed to change.

import { normalizeSize, sortSizes } from '@/lib/sizes';

const makeId = () =>
  globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// The stored list, cleaned up: parsed if it arrives as JSON text, entries
// without a size dropped, sizes in their canonical spelling.
export function stockItems(shirt) {
  let raw = shirt?.local_stock_items;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { raw = []; }
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(item => item && item.size)
    .map(item => ({
      id: String(item.id || makeId()),
      size: normalizeSize(item.size),
      name: String(item.name || '').trim(),
      number: String(item.number ?? '').trim(),
      player_version: !!item.player_version,
    }));
}

export function itemsForSize(shirt, size) {
  const wanted = normalizeSize(size);
  return stockItems(shirt).filter(item => item.size === wanted);
}

export function newStockItem(size = 'M') {
  return { id: makeId(), size: normalizeSize(size), name: '', number: '', player_version: false };
}

// { S: 2, L: 1 } - the shape every existing reader of local_stock_sizes expects.
export function summarizeStock(items) {
  const map = {};
  for (const item of items) {
    const size = normalizeSize(item.size);
    if (size) map[size] = (map[size] || 0) + 1;
  }
  return map;
}

// "S×2, L" for the admin, in size order.
export function stockSummaryText(items) {
  const map = summarizeStock(items);
  return sortSizes(Object.keys(map)).map(size => (map[size] > 1 ? `${size}×${map[size]}` : size)).join(', ');
}

// What is printed on the back: "MESSI 10", or '' for a blank shirt.
export function stockPrint(item) {
  return [item?.name, item?.number].map(v => String(v ?? '').trim()).filter(Boolean).join(' ');
}

// How an item is described to a customer choosing between them.
export function stockItemLabel(item) {
  return [stockPrint(item) || 'בלי הדפסה', item.player_version ? 'גרסת שחקן' : 'גרסה רגילה'].join(' · ');
}

// The fields to write when saving a shirt. The two legacy single-item fields
// are cleared so nothing reads a stale name that belongs to no shirt.
export function stockPayload(items) {
  const clean = (items || [])
    .filter(item => item && item.size)
    .map(item => ({
      id: String(item.id || makeId()),
      size: normalizeSize(item.size),
      name: String(item.name || '').trim(),
      number: String(item.number ?? '').trim(),
      player_version: !!item.player_version,
    }));
  return {
    local_stock_items: clean,
    local_stock_sizes: summarizeStock(clean),
    in_stock_local: clean.length > 0,
    local_stock_custom_name: null,
    local_stock_player_version: false,
  };
}
