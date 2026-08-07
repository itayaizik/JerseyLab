import React from 'react';
import { Info, ShoppingCart, MessageCircle, CreditCard } from 'lucide-react';
import { SHOP_PHONE, WHATSAPP_URL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/contact';

// There is no checkout on the site — an order is a request, and payment is
// arranged with us directly afterwards. Customers have to understand that
// *before* they submit, or the confirmation screen reads like a completed
// purchase that never arrives. Shown in the cart and on the FAQ page.

const STEPS = [
  { icon: ShoppingCart, title: 'שולחים בקשה', text: 'בוחרים חולצה, מידה והתאמות — ושולחים. בלי תשלום, בלי כרטיס אשראי.' },
  { icon: MessageCircle, title: 'חוזרים אליך', text: 'נוצר איתך קשר בערוץ שבחרת — וואטסאפ או אינסטגרם — לאישור כל הפרטים.' },
  { icon: CreditCard, title: 'סוגרים תשלום', text: 'רק אחרי שסיכמנו הכל מבצעים את התשלום ישירות מולנו, ואז ההזמנה יוצאת לדרך.' },
];

export default function HowItWorksNotice({ variant = 'compact' }) {
  const compact = variant === 'compact';

  return (
    <div className="bg-[#1B2A4A] p-4" style={{ border: '2px solid #1B2A4A', boxShadow: '3px 3px 0 #E8622A' }}>
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-4 h-4 text-[#E8622A] flex-shrink-0" />
        <p className="font-heading font-bold text-sm text-white uppercase tracking-wide">איך ההזמנה עובדת?</p>
      </div>

      <p className={`font-body leading-relaxed text-white/80 ${compact ? 'text-xs' : 'text-sm'}`}>
        <span className="text-[#FFD95A] font-bold">באתר לא מתבצע תשלום.</span>{' '}
        שליחת ההזמנה היא בקשה בלבד — נחזור אליך בוואטסאפ או באינסטגרם כדי לאשר את כל הפרטים,
        והתשלום מתבצע מולנו ישירות רק אחרי שסיכמנו.
      </p>

      <ol className="mt-3 space-y-2">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="flex gap-2.5 items-start">
              <span className="flex-shrink-0 w-5 h-5 bg-[#E8622A] text-white font-mono font-bold text-[10px] flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className={`font-heading font-bold text-white uppercase leading-tight flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'}`}>
                  <Icon className="w-3.5 h-3.5 text-[#E8622A] flex-shrink-0" />
                  {step.title}
                </p>
                <p className={`font-body text-white/70 leading-relaxed ${compact ? 'text-[11px]' : 'text-xs'}`}>
                  {step.text}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {!compact && (
        <div className="mt-4 pt-3 border-t border-white/15">
          <p className="text-xs text-white/70 font-body mb-2">רוצה לסגור הזמנה עכשיו? כתוב לנו ישירות:</p>
          <div className="flex flex-wrap gap-2">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 text-xs font-body font-bold text-[#1B2A4A] hover:bg-[#E8622A] hover:text-white transition-colors">
              <MessageCircle className="w-3.5 h-3.5" />
              <span dir="ltr">{SHOP_PHONE}</span>
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 text-xs font-body font-bold text-[#1B2A4A] hover:bg-[#E8622A] hover:text-white transition-colors">
              <span dir="ltr">@{INSTAGRAM_HANDLE}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
