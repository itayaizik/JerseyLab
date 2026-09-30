// The catalogue's filters, apart from the page that draws them.
//
// They lived inside /catalog, so a collection page - "חולצות נבחרות", with a
// hundred shirts on it - had a sort control and nothing else. A shopper who
// wanted a size had to go back to the catalogue and start again. The rules are
// the same wherever the grid is, so they are here rather than in a page.

import { shirtSizes, sortSizes } from '@/lib/sizes';
import { t } from '@/lib/i18n';

export const EMPTY_FILTERS = { condition: '', minPrice: '', maxPrice: '', league: '', national_team: '', size: '' };

export const CONDITION_LABELS = { new: t('חדש', 'New'), like_new: t('כמו חדש', 'Like new'), used: t('משומש', 'Used') };

export const hasAnyFilter = (filters) => Object.values(filters).some(Boolean);

// What there is to choose from, taken from the shirts actually on the page:
// offering a league with nothing behind it is a dead end with a label on it.
export function filterOptions(shirts) {
  return {
    leagues: [...new Set(shirts.map(s => s.league).filter(Boolean))].sort(),
    nationalTeams: [...new Set(shirts.map(s => s.national_team).filter(Boolean))].sort(),
    allSizes: sortSizes([...new Set(shirts.flatMap(shirtSizes))]),
    conditions: [...new Set(shirts.map(s => s.condition).filter(Boolean))],
  };
}

export function applyFilters(shirts, filters) {
  let result = shirts;
  if (filters.condition) result = result.filter(s => s.condition === filters.condition);
  if (filters.minPrice) result = result.filter(s => s.price >= Number(filters.minPrice));
  if (filters.maxPrice) result = result.filter(s => s.price <= Number(filters.maxPrice));
  if (filters.league) result = result.filter(s => s.league === filters.league);
  if (filters.national_team) result = result.filter(s => s.national_team === filters.national_team);
  if (filters.size) result = result.filter(s => shirtSizes(s).includes(filters.size));
  return result;
}

// The chips above the grid, one per filter in force. `size` carries its value
// separately because it reads left-to-right inside a right-to-left line.
export function activeFilters(filters) {
  return [
    filters.size && { key: 'size', label: t('מידה', 'Size'), ltrValue: filters.size },
    filters.league && { key: 'league', label: filters.league, translate: true },
    filters.national_team && { key: 'national_team', label: filters.national_team, translate: true },
    filters.condition && { key: 'condition', label: CONDITION_LABELS[filters.condition] || filters.condition },
    (filters.minPrice || filters.maxPrice) && { key: 'price', label: `₪${filters.minPrice || 0}–${filters.maxPrice || '∞'}` },
  ].filter(Boolean);
}

// Clearing one chip. Price is two fields behind one chip, so it is its own
// case rather than a key that happens not to exist.
export function withoutFilter(filters, key) {
  if (key === 'price') return { ...filters, minPrice: '', maxPrice: '' };
  return { ...filters, [key]: '' };
}
