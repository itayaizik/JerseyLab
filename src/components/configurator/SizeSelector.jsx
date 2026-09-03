import React from 'react';
import { shirtSizes, sizeQty } from '@/lib/sizes';

const FALLBACK_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

export default function SizeSelector({ shirt, value, onChange }) {
  const fromShirt = shirtSizes(shirt);
  const allSizes = fromShirt.length > 0 ? fromShirt : FALLBACK_SIZES;

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        {allSizes.map(s => {
          const isLocal = sizeQty(shirt.local_stock_sizes, s) > 0;
          const isSelected = value === s;
          return (
            <button key={s} type="button" onClick={() => onChange(s)}
              className={`flex flex-col items-center justify-center min-h-[3rem] min-w-[3rem] px-3 py-1.5 border-2 text-sm font-mono transition-all duration-200 ${
                isSelected
                  ? (isLocal ? 'border-green-700 bg-green-600 text-white scale-105' : 'bg-[#1B2A4A] text-white border-[#1B2A4A] scale-105')
                  : isLocal
                    ? 'border-green-600 text-green-700 bg-green-50 hover:bg-green-100'
                    : 'border-[#1B2A4A] text-[#1B2A4A] bg-white hover:bg-[#F2ECD9]'
              }`}>
              <span className="font-bold">{s}</span>
              {isLocal && <span className="text-[8px] font-heading font-bold uppercase leading-none mt-0.5">מלאי בארץ</span>}
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
            <p className="text-[#E8622A] font-bold">משלוח מהיר - הגעה עד 3 שבועות</p>
          )}
        </div>
      )}
    </div>
  );
}