import React from 'react';

export default function OrderSummary({ shirt, size, shirtType, addName, customName, customNumber, basePrice }) {
  const shirtTypeLabel = shirtType === 'player' ? 'גרסת שחקן' : 'גרסה רגילה';
  const printLabel = addName === 'yes' ? `שם: ${customName} ${customNumber}`.trim() : 'בלי שם';
  const extra = (shirtType === 'player' ? 20 : 0) + (addName === 'yes' ? 15 : 0);
  const total = basePrice + extra;

  return (
    <div className="bg-brand-cream border-2 border-brand-navy p-4 space-y-2">
      <div className="flex gap-3 items-start">
        {shirt.main_image && (
          <img src={shirt.main_image} alt="" className="w-14 h-14 object-cover border-2 border-brand-navy flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-sm text-brand-navy uppercase truncate">{shirt.name}</p>
          {shirt.club && <p className="text-xs text-gray-500 font-body">{shirt.club}{shirt.season ? ` • ${shirt.season}` : ''}</p>}
        </div>
      </div>
      <div className="border-t border-brand-navy/15 pt-2 space-y-1 text-sm font-body">
        <div className="flex justify-between"><span className="text-gray-500">מידה</span><span className="font-bold text-brand-navy">{size}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">סוג חולצה</span><span className="font-bold text-brand-navy">{shirtTypeLabel}</span></div>
        <div className="flex justify-between gap-2"><span className="text-gray-500 flex-shrink-0">הדפסה</span><span className="font-bold text-brand-navy text-left">{printLabel}</span></div>
      </div>
      <div className="flex justify-between items-center border-t border-brand-navy/15 pt-2">
        <span className="font-heading font-bold text-brand-navy uppercase text-sm">סה"כ</span>
        <span className="font-mono font-bold text-xl text-brand-orange">₪{total}</span>
      </div>
    </div>
  );
}