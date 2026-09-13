import React from 'react';
import {
  FAN_ROWS, PLAYER_ROWS, WOMEN_ROWS, KIDS_ROWS, KIDS_COLUMNS,
  ADULT_SIZES, WOMEN_SIZES, SIZE_TIPS, SIZE_TABS,
} from '@/lib/sizeCharts';

// The size tables as the shop shows them: a navy header row and alternating
// light rows. Used by the size guide page and the drawer on the product page.

export function SizeChartTabs({ value, onChange }) {
  return (
    <div role="tablist" aria-label="גרסה" className="flex flex-wrap gap-2">
      {SIZE_TABS.map(tab => (
        <button key={tab.key} type="button" role="tab" aria-selected={value === tab.key}
          onClick={() => onChange(tab.key)}
          className={`shop-chip px-5 ${value === tab.key ? 'shop-chip-active' : ''}`}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function MeasureTable({ rows, sizes }) {
  return (
    <table className="w-full min-w-[32rem] text-sm">
      <thead>
        <tr className="bg-brand-navy text-white">
          <th scope="col" className="px-4 py-3.5 text-start font-semibold">מידה</th>
          {sizes.map(size => (
            <th key={size} scope="col" dir="ltr" className="px-3 py-3.5 text-center font-semibold">{size}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.measure} className={i % 2 ? 'bg-brand-mist' : 'bg-white'}>
            <th scope="row" className="whitespace-nowrap px-4 py-3.5 text-start font-medium text-brand-navy/70">{row.measure}</th>
            {sizes.map(size => (
              <td key={size} dir="ltr" className="px-3 py-3.5 text-center tabular-nums text-brand-navy">{row[size]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function KidsTable() {
  return (
    <table className="w-full min-w-[32rem] text-sm">
      <thead>
        <tr className="bg-brand-navy text-white">
          {KIDS_COLUMNS.map(col => (
            <th key={col.key} scope="col" className="px-3 py-3.5 text-center font-semibold">{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {KIDS_ROWS.map((row, i) => (
          <tr key={row.size} className={i % 2 ? 'bg-brand-mist' : 'bg-white'}>
            {KIDS_COLUMNS.map((col, ci) => (
              <td key={col.key} dir="ltr"
                className={`px-3 py-3.5 text-center tabular-nums ${ci === 0 ? 'font-semibold text-brand-navy' : 'text-brand-navy/80'}`}>
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SizeChartTable({ tab }) {
  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-brand-line">
      {tab === 'fan' && <MeasureTable rows={FAN_ROWS} sizes={ADULT_SIZES} />}
      {tab === 'player' && <MeasureTable rows={PLAYER_ROWS} sizes={ADULT_SIZES} />}
      {tab === 'women' && <MeasureTable rows={WOMEN_ROWS} sizes={WOMEN_SIZES} />}
      {tab === 'kids' && <KidsTable />}
    </div>
  );
}

export function SizeTips({ compact = false }) {
  return (
    <div>
      <h3 className={`font-semibold text-brand-navy ${compact ? 'text-base' : 'text-lg'}`}>איך מודדים נכון?</h3>
      <ol className="mt-4 space-y-3">
        {SIZE_TIPS.map((tip, i) => (
          <li key={tip} className="flex items-start gap-3 text-[15px] leading-relaxed text-brand-navy/75">
            <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-orange-ink shadow-card">
              {i + 1}
            </span>
            {tip}
          </li>
        ))}
      </ol>
    </div>
  );
}
