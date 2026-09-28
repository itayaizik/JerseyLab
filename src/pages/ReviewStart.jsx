import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Star } from 'lucide-react';
import Seo from '@/components/Seo';
import { startReview, reviewPath } from '@/lib/reviewInvites';
import { t } from '@/lib/i18n';

// Where the QR on the card in the box lands. Every card carries the same code,
// so it cannot hold a personal review link the way a WhatsApp message does;
// this asks for the phone and the email from the order instead and hands the
// customer their own link (src/pages/ReviewInvite.jsx).

function Field({ id, label, hint = '', children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-brand-navy/70">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-[13px] text-brand-navy/55">{hint}</p>}
    </div>
  );
}

export default function ReviewStart() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    const result = await startReview({ phone, email });
    if (!result.ok) { setError(result.message); setBusy(false); return; }
    navigate(reviewPath(result.id), { replace: true });
  };

  return (
    <div className="shop-container py-8 lg:py-14">
      <Seo title={t('דירוג ההזמנה - JerseyLab', 'Review your order - JerseyLab')}
        description={t('ספרו לנו איך החולצה.', 'Tell us how the shirt is.')} canonicalPath="/" noindex />

      <div className="mx-auto max-w-md">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-mist text-brand-orange-ink">
          <Star className="h-7 w-7" aria-hidden="true" />
        </span>

        <h1 className="mt-5 text-2xl font-semibold text-brand-navy sm:text-3xl">
          {t('איך הייתה ההזמנה?', 'How was your order?')}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-brand-navy/65">
          {t('הזינו את הטלפון והאימייל שמסרתם בהזמנה ונפתח לכם את דף הדירוג. בלי הרשמה, לוקח דקה.',
             'Enter the phone and email you gave with your order and we’ll open your review page. No account, takes a minute.')}
        </p>

        <form onSubmit={submit} noValidate className="mt-7 space-y-4">
          <Field id="rs-phone" label={t('טלפון', 'Phone')}>
            <input id="rs-phone" value={phone} onChange={e => { setPhone(e.target.value); setError(''); }}
              type="tel" dir="ltr" maxLength={20} autoComplete="tel" required
              className="shop-field text-start" />
          </Field>

          <Field id="rs-email" label={t('אימייל', 'Email')}
            hint={t('אותו אימייל שאליו נשלח אישור ההזמנה.', 'The same address the order confirmation went to.')}>
            <input id="rs-email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
              type="email" dir="ltr" maxLength={254} autoComplete="email" required
              className="shop-field text-start" />
          </Field>

          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-[14px] leading-relaxed text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <p>{error}</p>
            </div>
          )}

          <button type="submit" disabled={busy} className="shop-btn w-full justify-center" aria-busy={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {t('לדף הדירוג', 'Go to my review')}
          </button>
        </form>

        <p className="mt-6 text-[13px] leading-relaxed text-brand-navy/55">
          {t('לא מוצאים את ההזמנה? כתבו לנו בוואטסאפ ונשלח לכם קישור.',
             'Can’t find your order? Message us on WhatsApp and we’ll send you a link.')}
        </p>
      </div>
    </div>
  );
}
