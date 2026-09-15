import React from 'react';
import { EXTRA_PRICES, PATCHES_LABEL, LONG_SLEEVE_LABEL, SHORTS_LABEL } from '@/lib/cart';
import { t } from '@/lib/i18n';
import { term, shirtName } from '@/lib/english';

function Row({ label, value, ltr = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="flex-shrink-0 text-brand-navy/55">{label}</dt>
      <dd dir={ltr ? 'ltr' : undefined} className="text-end font-semibold text-brand-navy">{value}</dd>
    </div>
  );
}

export default function OrderSummary({
  shirt, size, shirtType, addName, customName, customNumber, basePrice,
  patches = false, longSleeve = false, shorts = false,
}) {
  const shirtTypeLabel = shirtType === 'player' ? t('גרסת שחקן', 'Player version') : t('גרסה רגילה', 'Regular version');
  const printing = addName === 'yes';
  const printLabel = printing ? `${customName} ${customNumber}`.trim() : t('בלי הדפסה', 'No print');
  const extra = (shirtType === 'player' ? EXTRA_PRICES.player : 0)
    + (printing ? EXTRA_PRICES.name : 0)
    + (patches ? EXTRA_PRICES.patches : 0)
    + (longSleeve ? EXTRA_PRICES.longSleeve : 0)
    + (shorts ? EXTRA_PRICES.shorts : 0);
  const total = basePrice + extra;

  return (
    <div className="rounded-2xl bg-brand-mist p-4">
      <div className="flex items-center gap-3">
        {shirt.main_image && (
          <img src={shirt.main_image} alt="" className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-brand-navy">{shirtName(shirt)}</p>
          {shirt.club && <p className="text-[13px] text-brand-navy/55">{term(shirt.club)}{shirt.season ? ` · ${shirt.season}` : ''}</p>}
        </div>
      </div>
      <dl className="mt-4 space-y-2 border-t border-brand-line pt-4 text-sm">
        <Row label={t('מידה', 'Size')} value={size} ltr />
        <Row label={t('גרסה', 'Version')} value={shirtTypeLabel} />
        <Row label={t('הדפסה', 'Print')} value={printLabel} ltr={printing} />
        {longSleeve && <Row label={t(LONG_SLEEVE_LABEL, 'Long sleeve')} value={`+₪${EXTRA_PRICES.longSleeve}`} />}
        {shorts && <Row label={t(`${SHORTS_LABEL} (מידה ${size})`, `Shorts (size ${size})`)} value={`+₪${EXTRA_PRICES.shorts}`} />}
        {patches && <Row label={t(PATCHES_LABEL, 'Patches')} value={`+₪${EXTRA_PRICES.patches}`} />}
      </dl>
      <div className="mt-4 flex items-baseline justify-between border-t border-brand-line pt-4">
        <span className="font-semibold text-brand-navy">{t('סה״כ', 'Total')}</span>
        <span className="text-xl font-bold tabular-nums text-brand-navy">₪{total}</span>
      </div>
    </div>
  );
}
