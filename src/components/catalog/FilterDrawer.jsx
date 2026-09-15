import React from 'react';
import SideDrawer from '@/components/shop/SideDrawer';
import Disclosure from '@/components/shop/Disclosure';
import { t } from '@/lib/i18n';
import { term } from '@/lib/english';

// The catalogue filters, in a drawer from the side. Filters apply as they are
// chosen - the button at the foot shows how many shirts are left and closes
// the drawer, rather than being a step without which nothing happens.
//
// Leagues and teams are filtered by their Hebrew value, which is what the
// shirts store, and shown in the site's language.

const CONDITION_LABELS = { new: t('חדש', 'New'), like_new: t('כמו חדש', 'Like new'), used: t('משומש', 'Used') };

function OptionChips({ options, value, onSelect, ltr = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(selected ? '' : option.value)}
            className={`shop-chip min-h-[2.5rem] px-4 ${selected ? 'shop-chip-active' : ''}`}
          >
            <span dir={ltr ? 'ltr' : undefined}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function FilterDrawer({
  open,
  onOpenChange,
  filters,
  onChange,
  onClear,
  resultCount,
  sizes = [],
  leagues = [],
  nationalTeams = [],
  conditions = [],
}) {
  const priceMeta = filters.minPrice || filters.maxPrice
    ? `₪${filters.minPrice || 0}–${filters.maxPrice || '∞'}`
    : undefined;

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="start"
      label={t('סינון לפי', 'Filter by')}
      bodyClassName="space-y-2.5"
      footer={(
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <button type="button" onClick={onClear} className="shop-link px-2 text-[15px]">{t('ניקוי הכל', 'Clear all')}</button>
          <button type="button" onClick={() => onOpenChange(false)} className="shop-btn w-full">
            {resultCount === 0 ? t('אין חולצות מתאימות', 'No matching shirts') : t(`הצגת ${resultCount} חולצות`, `Show ${resultCount} shirts`)}
          </button>
        </div>
      )}
    >
      {sizes.length > 0 && (
        <Disclosure title={t('מידה', 'Size')} meta={filters.size || undefined} defaultOpen={!!filters.size}>
          <OptionChips ltr options={sizes.map(s => ({ value: s, label: s }))} value={filters.size} onSelect={v => onChange('size', v)} />
        </Disclosure>
      )}

      <Disclosure title={t('מחיר', 'Price')} meta={priceMeta} defaultOpen={!!priceMeta}>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="block">
            <span className="mb-1.5 block text-sm text-brand-navy/60">{t('ממחיר', 'From')}</span>
            <input type="number" inputMode="numeric" min="0" dir="ltr" placeholder="₪"
              value={filters.minPrice} onChange={e => onChange('minPrice', e.target.value)}
              className="shop-field text-start" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-brand-navy/60">{t('עד מחיר', 'To')}</span>
            <input type="number" inputMode="numeric" min="0" dir="ltr" placeholder="₪"
              value={filters.maxPrice} onChange={e => onChange('maxPrice', e.target.value)}
              className="shop-field text-start" />
          </label>
        </div>
      </Disclosure>

      {leagues.length > 0 && (
        <Disclosure title={t('ליגה', 'League')} meta={term(filters.league) || undefined} defaultOpen={!!filters.league}>
          <OptionChips options={leagues.map(l => ({ value: l, label: term(l) }))} value={filters.league} onSelect={v => onChange('league', v)} />
        </Disclosure>
      )}

      {nationalTeams.length > 0 && (
        <Disclosure title={t('נבחרת', 'National team')} meta={term(filters.national_team) || undefined} defaultOpen={!!filters.national_team}>
          <OptionChips options={nationalTeams.map(n => ({ value: n, label: term(n) }))} value={filters.national_team} onSelect={v => onChange('national_team', v)} />
        </Disclosure>
      )}

      {/* Only worth asking when the catalogue actually holds more than one. */}
      {conditions.length > 1 && (
        <Disclosure title={t('מצב', 'Condition')} meta={CONDITION_LABELS[filters.condition]} defaultOpen={!!filters.condition}>
          <OptionChips
            options={conditions.map(c => ({ value: c, label: CONDITION_LABELS[c] || c }))}
            value={filters.condition}
            onSelect={v => onChange('condition', v)}
          />
        </Disclosure>
      )}
    </SideDrawer>
  );
}
