import React from 'react';
import { shirtSizes, isSizeAvailable } from '@/lib/sizes';
import { t } from '@/lib/i18n';
import { showsLocalStockForSize } from '@/components/ShippingBadge';

const FALLBACK_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

// The size chips, shared by the product page and the quick-add window.
//
// Three states per size, from lib/sizes: orderable; sold out, which stays on
// screen struck through so the customer can see the shirt is made in their size
// and is worth asking about; and not offered at all, which is not shown. A green
// dot marks a size that is physically in Israel and arrives within a week.
export default function SizeSelector({ shirt, value, onChange, showNote = true, invalid = false }) {
  const fromShirt = shirtSizes(shirt);
  const allSizes = fromShirt.length > 0 ? fromShirt : FALLBACK_SIZES;
  const isLocal = (size) => isSizeAvailable(shirt, size) && showsLocalStockForSize(shirt, size);
  const anyLocal = allSizes.some(isLocal);

  return (
    <div>
      <div role="group" aria-label={t('מידה', 'Size')} className="flex flex-wrap gap-2">
        {allSizes.map(size => {
          const available = isSizeAvailable(shirt, size);
          const local = isLocal(size);
          const isSelected = value === size;
          return (
            <button
              key={size}
              type="button"
              disabled={!available}
              aria-pressed={isSelected}
              aria-label={!available ? `${size} - ${t('אזל', 'sold out')}` : local ? `${size} - ${t('במלאי בארץ', 'in stock in Israel')}` : size}
              onClick={() => onChange(size)}
              className={`shop-chip relative min-w-[3.5rem] px-4 font-semibold tabular-nums ${
                !available
                  ? 'cursor-not-allowed text-brand-navy/30 line-through hover:border-brand-line hover:text-brand-navy/30'
                  : isSelected
                    ? 'shop-chip-active'
                    : invalid ? 'border-red-300' : ''
              }`}
            >
              <span dir="ltr">{size}</span>
              {local && (
                <span aria-hidden="true" className="absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>

      {showNote && (value ? (
        showsLocalStockForSize(shirt, value) ? (
          <p className="mt-3 flex items-center gap-2 text-[13px] font-medium text-emerald-700">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
            {t('במלאי בארץ · מגיעה עד שבוע או באיסוף מקריית אונו', 'In stock in Israel · arrives within a week, or pick it up in Kiryat Ono')}
          </p>
        ) : (
          <p className="mt-3 text-[13px] text-brand-navy/55">{t('הזמנה מיוחדת · מגיעה עד 3 שבועות', 'Made to order · arrives within 3 weeks')}</p>
        )
      ) : anyLocal && (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-brand-navy/55">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
          {t('מידה עם נקודה ירוקה נמצאת במלאי בארץ', 'Sizes with a green dot are in stock in Israel')}
        </p>
      ))}
    </div>
  );
}
