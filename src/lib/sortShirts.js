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

// `keepOrder` is for a list that already arrives in the order that matters -
// a search ranked by best match - where "recommended" means exactly that.
//
// `preferredClubs` are the clubs this shopper has bought from before
// (src/lib/taste.js). Everything else being equal, more of what they already
// chose beats a stranger's shirt.
export function sortShirts(list, sort, { keepOrder = false, preferredClubs = [] } = {}) {
  if (sort === 'price-asc') return [...list].sort((a, b) => shirtBasePrice(a) - shirtBasePrice(b));
  if (sort === 'price-desc') return [...list].sort((a, b) => shirtBasePrice(b) - shirtBasePrice(a));
  if (sort === 'newest') return [...list].sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')));
  if (keepOrder) return list;

  // "Recommended" used to be the owner's two flags and then whatever order the
  // list came in, which on a collection page was newest first - so the same
  // shirts led every page for as long as nothing new went up. What shoppers
  // actually look at is a better guide, and it changes on its own.
  const prefer = new Set(preferredClubs.filter(Boolean));
  const matchesTaste = s => prefer.has(s.club) || prefer.has(s.national_team);
  const rank = [
    s => (matchesTaste(s) ? 1 : 0),
    s => (s.featured ? 1 : 0),
    s => s.views_count || 0,
    s => (s.best_seller ? 1 : 0),
  ];
  return [...list].sort((a, b) => {
    for (const by of rank) {
      const diff = by(b) - by(a);
      if (diff) return diff;
    }
    // A tie falls back to the incoming order, which is newest first.
    return 0;
  });
}
