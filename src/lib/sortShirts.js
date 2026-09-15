import { shirtBasePrice } from '@/lib/cart';
import { t } from '@/lib/i18n';

// The orders a list of shirts can be shown in, shared by the catalogue and the
// collection pages.

export const SORT_OPTIONS = [
  { value: 'featured', label: t('מומלצות', 'Recommended') },
  { value: 'newest', label: t('חדשות באתר', 'Newest') },
  { value: 'price-asc', label: t('מחיר: מהנמוך לגבוה', 'Price: low to high') },
  { value: 'price-desc', label: t('מחיר: מהגבוה לנמוך', 'Price: high to low') },
];

// `keepOrder` is for lists that arrive already in the order that matters - a
// search ranked by best match, a collection sorted newest season first - where
// "recommended" should mean exactly that order.
export function sortShirts(list, sort, { keepOrder = false } = {}) {
  if (sort === 'price-asc') return [...list].sort((a, b) => shirtBasePrice(a) - shirtBasePrice(b));
  if (sort === 'price-desc') return [...list].sort((a, b) => shirtBasePrice(b) - shirtBasePrice(a));
  if (sort === 'newest') return [...list].sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')));
  if (keepOrder) return list;
  // Featured shirts first, then best sellers. The sort is stable, so within
  // each group the incoming newest-first order holds.
  const rank = s => (s.featured ? 2 : 0) + (s.best_seller ? 1 : 0);
  return [...list].sort((a, b) => rank(b) - rank(a));
}
