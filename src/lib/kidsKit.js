// The kids kit: a different product behind the same shirt.
//
// A child's shirt is not a men's shirt in a smaller size. It comes as a set
// with matching shorts and nothing else - no long sleeve, no patches, no
// player version - so the choices a grown-up gets would all be choices that
// cannot be made. It is one price, ₪100, whatever goes on it, and the name and
// number on the back are included rather than charged for.
//
// Sizes are the kids table's own: 14 to 28, read by the child's height rather
// than by S/M/L.

import { KIDS_ROWS } from '@/lib/sizeCharts';
import { t } from '@/lib/i18n';

export const KIDS_PRICE = 100;

export const KIDS_SIZES = KIDS_ROWS.map(row => row.size);

// What the order says the customer bought, in the free-text line the admin and
// the supplier both read.
export const KIDS_KIT_LABEL = 'סט ילדים';
export const KIDS_KIT_VALUE = 'חולצה + מכנס קצר';
export const KIDS_PRINT_LABEL = 'שם ומספר';

export const kidsRow = (size) => KIDS_ROWS.find(row => row.size === String(size)) || null;

// A size number means nothing on its own: what a parent knows is how tall
// their child is.
export function kidsSizeHint(size) {
  const row = kidsRow(size);
  if (!row) return '';
  return t(`גובה ${row.height} ס"מ · גיל ${row.age}`, `Height ${row.height}cm · age ${row.age}`);
}

export const isKidsSize = (size) => KIDS_SIZES.includes(String(size));
