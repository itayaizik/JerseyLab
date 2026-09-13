import React from 'react';
import SideDrawer from '@/components/shop/SideDrawer';
import Disclosure from '@/components/shop/Disclosure';

// The catalogue filters, in a drawer from the side. Filters apply as they are
// chosen - the button at the foot shows how many shirts are left and closes
// the drawer, rather than being a step without which nothing happens.

const CONDITION_LABELS = { new: 'חדש', like_new: 'כמו חדש', used: 'משומש' };

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
      label="סינון לפי"
      bodyClassName="space-y-2.5"
      footer={(
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <button type="button" onClick={onClear} className="shop-link px-2 text-[15px]">ניקוי הכל</button>
          <button type="button" onClick={() => onOpenChange(false)} className="shop-btn w-full">
            {resultCount === 0 ? 'אין חולצות מתאימות' : `הצגת ${resultCount} חולצות`}
          </button>
        </div>
      )}
    >
      {sizes.length > 0 && (
        <Disclosure title="מידה" meta={filters.size || undefined} defaultOpen={!!filters.size}>
          <OptionChips ltr options={sizes.map(s => ({ value: s, label: s }))} value={filters.size} onSelect={v => onChange('size', v)} />
        </Disclosure>
      )}

      <Disclosure title="מחיר" meta={priceMeta} defaultOpen={!!priceMeta}>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="block">
            <span className="mb-1.5 block text-sm text-brand-navy/60">ממחיר</span>
            <input type="number" inputMode="numeric" min="0" dir="ltr" placeholder="₪"
              value={filters.minPrice} onChange={e => onChange('minPrice', e.target.value)}
              className="shop-field text-right" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-brand-navy/60">עד מחיר</span>
            <input type="number" inputMode="numeric" min="0" dir="ltr" placeholder="₪"
              value={filters.maxPrice} onChange={e => onChange('maxPrice', e.target.value)}
              className="shop-field text-right" />
          </label>
        </div>
      </Disclosure>

      {leagues.length > 0 && (
        <Disclosure title="ליגה" meta={filters.league || undefined} defaultOpen={!!filters.league}>
          <OptionChips options={leagues.map(l => ({ value: l, label: l }))} value={filters.league} onSelect={v => onChange('league', v)} />
        </Disclosure>
      )}

      {nationalTeams.length > 0 && (
        <Disclosure title="נבחרת" meta={filters.national_team || undefined} defaultOpen={!!filters.national_team}>
          <OptionChips options={nationalTeams.map(n => ({ value: n, label: n }))} value={filters.national_team} onSelect={v => onChange('national_team', v)} />
        </Disclosure>
      )}

      {/* Only worth asking when the catalogue actually holds more than one. */}
      {conditions.length > 1 && (
        <Disclosure title="מצב" meta={CONDITION_LABELS[filters.condition]} defaultOpen={!!filters.condition}>
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
