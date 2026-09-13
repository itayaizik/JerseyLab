import React from 'react';
import { EXTRA_PRICES } from '@/lib/cart';

function Row({ label, value, ltr = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="flex-shrink-0 text-brand-navy/55">{label}</dt>
      <dd dir={ltr ? 'ltr' : undefined} className="text-end font-semibold text-brand-navy">{value}</dd>
    </div>
  );
}

export default function OrderSummary({ shirt, size, shirtType, addName, customName, customNumber, basePrice }) {
  const shirtTypeLabel = shirtType === 'player' ? 'גרסת שחקן' : 'גרסה רגילה';
  const printing = addName === 'yes';
  const printLabel = printing ? `${customName} ${customNumber}`.trim() : 'בלי הדפסה';
  const extra = (shirtType === 'player' ? EXTRA_PRICES.player : 0) + (printing ? EXTRA_PRICES.name : 0);
  const total = basePrice + extra;

  return (
    <div className="rounded-2xl bg-brand-mist p-4">
      <div className="flex items-center gap-3">
        {shirt.main_image && (
          <img src={shirt.main_image} alt="" className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-brand-navy">{shirt.name}</p>
          {shirt.club && <p className="text-[13px] text-brand-navy/55">{shirt.club}{shirt.season ? ` · ${shirt.season}` : ''}</p>}
        </div>
      </div>
      <dl className="mt-4 space-y-2 border-t border-brand-line pt-4 text-sm">
        <Row label="מידה" value={size} ltr />
        <Row label="גרסה" value={shirtTypeLabel} />
        <Row label="הדפסה" value={printLabel} ltr={printing} />
      </dl>
      <div className="mt-4 flex items-baseline justify-between border-t border-brand-line pt-4">
        <span className="font-semibold text-brand-navy">סה״כ</span>
        <span className="text-xl font-bold tabular-nums text-brand-navy">₪{total}</span>
      </div>
    </div>
  );
}
