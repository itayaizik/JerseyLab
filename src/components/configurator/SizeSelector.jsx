import React from 'react';
import { shirtSizes, sizeQty, isSizeAvailable } from '@/lib/sizes';

const FALLBACK_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

export default function SizeSelector({ shirt, value, onChange }) {
  const fromShirt = shirtSizes(shirt);
  const allSizes = fromShirt.length > 0 ? fromShirt : FALLBACK_SIZES;

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        {allSizes.map(s => {
          const available = isSizeAvailable(shirt, s);
          const isLocal = available && sizeQty(shirt.local_stock_sizes, s) > 0;
          const isSelected = value === s;
          return (
            <button key={s} type="button" disabled={!available}
              aria-label={available ? s : `${s} - אזל`}
              onClick={() => onChange(s)}
              className={`flex flex-col items-center justify-center min-h-[3rem] min-w-[3rem] px-3 py-1.5 border-2 text-sm font-mono transition-all duration-200 ${
                !available
                  ? 'border-brand-navy/25 text-brand-navy/35 line-through cursor-not-allowed'
                  : isSelected
                  ? (isLocal ? 'border-green-700 bg-green-600 text-white scale-105' : 'bg-brand-navy text-white border-brand-navy scale-105')
                  : isLocal
                    ? 'border-green-600 text-green-700 bg-green-50 hover:bg-green-100'
                    : 'border-brand-navy text-brand-navy bg-white hover:bg-brand-cream'
              }`}>
              <span className="font-bold">{s}</span>
              {!available
                ? <span className="text-[8px] font-heading font-bold uppercase leading-none mt-0.5 no-underline">אזל</span>
                : isLocal && <span className="text-[8px] font-heading font-bold uppercase leading-none mt-0.5">מלאי בארץ</span>}
            </button>
          );
        })}
      </div>
      {value && (
        <div className="mt-3 text-xs font-body">
          {sizeQty(shirt.local_stock_sizes, value) > 0 ? (
            <p className="text-green-700 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-600" />
              זמין במלאי בארץ - הגעה עד שבוע או איסוף מקריית אונו
            </p>
          ) : (
            <p className="text-brand-orange font-bold">משלוח מהיר - הגעה עד 3 שבועות</p>
          )}
        </div>
      )}
    </div>
  );
}