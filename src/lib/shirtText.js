// The admin forms used to save whatever was typed, spaces and all, straight
// into the catalogue. A single trailing space is invisible in the form but
// splits a club in two everywhere the value is grouped or compared: "צלסי "
// became a separate club from "צלסי", with its own half-empty collection page
// and its own broken filter.

const TEXT_FIELDS = [
  'name',
  'club',
  'national_team',
  'league',
  'season',
  'player_name',
  'description',
  'local_stock_custom_name',
  'fast_shipping_note',
];

// Typos that reached the catalogue often enough to be worth correcting on the
// way in rather than chasing afterwards.
const CORRECTIONS = {
  league: { 'פריימר ליג': 'פרמייר ליג' },
};

export function trimShirtText(form) {
  const out = { ...form };

  for (const field of TEXT_FIELDS) {
    if (typeof out[field] !== 'string') continue;
    // Collapse runs of whitespace too: a double space inside a club name
    // splits it just as effectively as one on the end.
    const cleaned = out[field].trim().replace(/\s+/g, ' ');
    out[field] = CORRECTIONS[field]?.[cleaned] ?? cleaned;
  }

  if (Array.isArray(out.tags)) {
    out.tags = out.tags
      .map(tag => (typeof tag === 'string' ? tag.trim().replace(/\s+/g, ' ') : tag))
      .filter(Boolean);
  }

  // A national team is not a club. The import left the same name in both
  // columns on some rows, which put national sides into club collections.
  if (out.national_team && out.club && out.national_team === out.club) {
    out.club = '';
  }

  return out;
}
