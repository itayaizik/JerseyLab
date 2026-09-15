import React from 'react';
import { Info, MessageCircle, Instagram } from 'lucide-react';
import { SHOP_PHONE, WHATSAPP_URL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/contact';
import { t } from '@/lib/i18n';

// There is no checkout on the site - an order is a request, and payment is
// arranged with us directly afterwards. Customers have to understand that
// *before* they submit, or the confirmation screen reads like a completed
// purchase that never arrives. Shown in the cart, on the FAQ page and on the
// mystery box page.

const STEPS = [
  {
    title: t('שולחים בקשה', 'Send a request'),
    text: t('בוחרים חולצה, מידה והתאמות ושולחים. בלי תשלום ובלי כרטיס אשראי.', 'Choose a shirt, a size and any options, and send. No payment and no credit card.'),
  },
  {
    title: t('חוזרים אליכם', 'We get back to you'),
    text: t('נוצר איתכם קשר בערוץ שבחרתם, וואטסאפ או אינסטגרם, לאישור כל הפרטים.', 'We contact you on the channel you chose, WhatsApp or Instagram, to confirm all the details.'),
  },
  {
    title: t('סוגרים תשלום', 'Settle payment'),
    text: t('רק אחרי שסיכמנו הכל משלמים ישירות מולנו, וההזמנה יוצאת לדרך.', 'Only once everything is agreed do you pay us directly, and the order is on its way.'),
  },
];

export default function HowItWorksNotice({ variant = 'compact' }) {
  const compact = variant === 'compact';

  return (
    <div className={`rounded-2xl bg-brand-mist ${compact ? 'p-4' : 'p-5 sm:p-7'}`}>
      <div className="flex items-center gap-2">
        <Info className="h-[1.1rem] w-[1.1rem] flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />
        <p className={`font-semibold text-brand-navy ${compact ? 'text-[15px]' : 'text-lg'}`}>{t('איך ההזמנה עובדת?', 'How does ordering work?')}</p>
      </div>

      <p className={`mt-2 leading-relaxed text-brand-navy/70 ${compact ? 'text-[13px]' : 'text-[15px]'}`}>
        <span className="font-semibold text-brand-navy">{t('באתר לא מתבצע תשלום.', 'Nothing is charged on the site.')}</span>{' '}
        {t('שליחת ההזמנה היא בקשה בלבד. נחזור אליכם בוואטסאפ או באינסטגרם כדי לאשר את כל הפרטים, והתשלום מתבצע מולנו ישירות רק אחרי שסיכמנו.',
          "Sending an order is only a request. We'll get back to you on WhatsApp or Instagram to confirm every detail, and you pay us directly only once everything is agreed.")}
      </p>

      <ol className={`space-y-2.5 ${compact ? 'mt-3' : 'mt-5'}`}>
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-orange-ink shadow-card">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className={`font-semibold leading-tight text-brand-navy ${compact ? 'text-[13px]' : 'text-[15px]'}`}>{step.title}</p>
              <p className={`mt-0.5 leading-relaxed text-brand-navy/60 ${compact ? 'text-xs' : 'text-sm'}`}>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      {!compact && (
        <div className="mt-5 border-t border-brand-line pt-4">
          <p className="text-sm text-brand-navy/65">{t('רוצים לסגור הזמנה עכשיו? כתבו לנו ישירות:', 'Want to order right now? Write to us directly:')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="shop-chip bg-white">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span dir="ltr">{SHOP_PHONE}</span>
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="shop-chip bg-white">
              <Instagram className="h-4 w-4" aria-hidden="true" />
              <span dir="ltr">@{INSTAGRAM_HANDLE}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
