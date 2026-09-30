import React, { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import FilterDrawer from '@/components/catalog/FilterDrawer';
import SortSelect from '@/components/catalog/SortSelect';
import { EMPTY_FILTERS, activeFilters, withoutFilter } from '@/lib/shirtFilters';
import { t } from '@/lib/i18n';
import { term } from '@/lib/english';

// The filter button, the chips for what is in force, and the drawer itself.
//
// One component because the three only make sense together: a button with no
// chips hides what the shopper has already chosen, and chips with no way back
// to the drawer are a dead end.

export default function FilterBar({ filters, onChange, options, resultCount, sort, onSortChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const chips = activeFilters(filters);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setOpen(true)}
          className="inline-flex min-h-[3.25rem] items-center gap-2.5 rounded-2xl border border-brand-line bg-white px-5 text-[15px] font-medium text-brand-navy transition hover:border-brand-navy/30 sm:min-h-[3.5rem] sm:px-6 sm:text-base">
          <SlidersHorizontal className="h-5 w-5 text-brand-orange-ink" aria-hidden="true" />
          {t('סינון', 'Filter')}
          {chips.length > 0 && (
            <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-brand-orange px-1.5 text-xs font-bold text-white">
              {chips.length}
            </span>
          )}
        </button>
        {onSortChange && <SortSelect value={sort} onChange={onSortChange} />}
      </div>

      {chips.length > 0 && (
        <ul className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map(chip => (
            <li key={chip.key}>
              <button type="button" onClick={() => onChange(withoutFilter(filters, chip.key))}
                className="shop-chip min-h-[2.25rem] gap-1.5 px-3.5 text-[13px]">
                {chip.translate ? term(chip.label) : chip.label}
                {chip.ltrValue && <span dir="ltr">{chip.ltrValue}</span>}
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">{t('הסרת הסינון', 'Remove filter')}</span>
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => onChange(EMPTY_FILTERS)} className="shop-link px-2 text-[13px]">
              {t('ניקוי הכל', 'Clear all')}
            </button>
          </li>
        </ul>
      )}

      <FilterDrawer
        open={open}
        onOpenChange={setOpen}
        filters={filters}
        onChange={(key, value) => onChange({ ...filters, [key]: value })}
        onClear={() => onChange(EMPTY_FILTERS)}
        resultCount={resultCount}
        sizes={options.allSizes}
        leagues={options.leagues}
        nationalTeams={options.nationalTeams}
        conditions={options.conditions}
      />
    </div>
  );
}
