import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, Star, ImagePlus, X, Heart, ChevronDown, Check } from 'lucide-react';
import Seo from '@/components/Seo';
import ProductImage from '@/components/ui/ProductImage';
import { base44 } from '@/api/base44Client';
import { searchShirts } from '@/lib/search';
import { shirtName } from '@/lib/english';
import { submitOpenReview, uploadOpenPhoto } from '@/lib/reviewInvites';
import { t } from '@/lib/i18n';

// Where the QR on the card in the box lands.
//
// Stars, a few words, and that is a review. Everything else - what was
// bought, a photo, a name, the order details - is offered and never required:
// the card is read a minute after the box is opened, and a form that starts by
// asking someone to find the email they ordered with is a form that does not
// get filled in.
//
// Filling in the phone and email marks the review a verified purchase and
// attaches it to the order (supabase/open_reviews.sql). Leaving them out still
// leaves a review. Either way the admin approves it before it appears.

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function Stars({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const labels = ['גרוע', 'בסדר', 'טוב', 'טוב מאוד', 'מצוין'];
  return (
    <div>
      <div role="radiogroup" aria-label={t('דירוג', 'Rating')} className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" role="radio" aria-checked={value === n}
            aria-label={t(`${n} כוכבים`, `${n} stars`)}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            className="rounded-xl p-1 transition hover:scale-110">
            <Star className={`h-11 w-11 transition ${(hover || value) >= n ? 'fill-brand-orange text-brand-orange' : 'text-brand-line'}`} />
          </button>
        ))}
      </div>
      <p className="mt-2 h-5 text-center text-[14px] font-medium text-brand-navy/70">
        {(hover || value) ? t(labels[(hover || value) - 1], ['Poor', 'Okay', 'Good', 'Very good', 'Excellent'][(hover || value) - 1]) : ''}
      </p>
    </div>
  );
}

// What they bought: type a word, pick a shirt. Optional, and a shirt that is
// not in the list is simply typed out.
function BoughtField({ value, onChange, shirt, onPick }) {
  const [shirts, setShirts] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    base44.entities.Shirt.filter({ status: 'available' }, '-created_date', 500)
      .then(rows => { if (!cancelled) setShirts(rows); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const matches = value.trim().length >= 2 && !shirt && shirts.length
    ? searchShirts(shirts, value.trim()).results.slice(0, 4)
    : [];

  return (
    <div>
      <label htmlFor="rv-bought" className="mb-1.5 block text-sm font-medium text-brand-navy/70">
        {t('מה הזמנת?', 'What did you order?')} <span className="font-normal text-brand-navy/40">{t('(לא חובה)', '(optional)')}</span>
      </label>

      {shirt ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-line p-2.5">
          <span className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-brand-mist">
            <ProductImage src={shirt.main_image} alt="" sizes="48px" className="h-full w-full object-cover" />
          </span>
          <span className="min-w-0 flex-1 text-[15px] font-medium text-brand-navy">{shirtName(shirt)}</span>
          <button type="button" onClick={() => { onPick(null); onChange(''); }}
            aria-label={t('בחירה אחרת', 'Choose something else')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-brand-navy/50 transition hover:bg-brand-mist">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <input id="rv-bought" value={value} autoComplete="off"
            onChange={e => { onChange(e.target.value); setOpen(true); }}
            placeholder={t('למשל: ברצלונה בית, או מיסטרי בוקס', 'For example: Barcelona home, or a Mystery Box')}
            maxLength={120} className="shop-field" />
          {open && matches.length > 0 && (
            <ul className="mt-2 space-y-1">
              {matches.map(s => (
                <li key={s.id}>
                  <button type="button" onClick={() => { onPick(s); setOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-2xl p-2 text-start transition hover:bg-brand-mist">
                    <span className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-brand-mist">
                      <ProductImage src={s.main_image} alt="" sizes="40px" className="h-full w-full object-cover" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[14px] text-brand-navy">{shirtName(s)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default function ReviewStart() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [bought, setBought] = useState('');
  const [shirt, setShirt] = useState(null);
  const [name, setName] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [orderOpen, setOrderOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // { verified }

  const pickPhoto = (chosen) => {
    if (!chosen) return;
    if (!chosen.type.startsWith('image/')) { setError(t('אפשר להעלות רק תמונות.', 'Only photos can be uploaded.')); return; }
    if (chosen.size > MAX_PHOTO_BYTES) { setError(t('התמונה גדולה מדי (עד 10MB).', 'The photo is too large (up to 10MB).')); return; }
    setError('');
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!rating) { setError(t('בחרו כמה כוכבים.', 'Choose a rating.')); return; }
    if (comment.trim().length < 5) { setError(t('כתבו כמה מילים על ההזמנה.', 'Write a few words about your order.')); return; }
    setBusy(true);
    setError('');
    try {
      const image_url = file ? await uploadOpenPhoto(file) : '';
      const result = await submitOpenReview({
        rating,
        comment: comment.trim(),
        name: name.trim(),
        anonymous,
        bought: shirt ? '' : bought.trim(),
        shirtId: shirt?.id || '',
        imageUrl: image_url,
        phone: phone.trim(),
        email: email.trim(),
      });
      if (!result.ok) { setError(result.message); return; }
      setDone({ verified: !!result.verified });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError(t('העלאת התמונה נכשלה. נסו בלי תמונה.', 'The photo could not be uploaded. Try without one.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="shop-container py-8 lg:py-14">
      <Seo title={t('דירוג ההזמנה - JerseyLab', 'Review your order - JerseyLab')}
        description={t('ספרו לנו איך החולצה.', 'Tell us how the shirt is.')} canonicalPath="/" noindex />

      <div className="mx-auto max-w-lg">
        {done ? (
          <div role="status" className="rounded-3xl bg-brand-mist p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-orange-ink shadow-card">
              <Heart className="h-7 w-7" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-2xl font-semibold text-brand-navy">{t('תודה רבה!', 'Thank you!')}</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-brand-navy/65">
              {t('הביקורת התקבלה ותופיע באתר אחרי שנעבור עליה.', "Your review is in, and it'll appear once we've looked it over.")}
            </p>
            <Link to="/catalog" className="shop-btn mt-6">{t('לחולצות נוספות', 'More shirts')}</Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h1 className="text-center text-2xl font-semibold text-brand-navy sm:text-3xl">
              {t('איך הייתה ההזמנה?', 'How was your order?')}
            </h1>
            <p className="mt-2 text-center text-[15px] leading-relaxed text-brand-navy/65">
              {t('דירוג וכמה מילים, וזהו. בלי הרשמה ובלי פרטים.', 'A rating and a few words, that is all. No account, no details.')}
            </p>

            <div className="shop-card mt-7 space-y-5 p-5 sm:p-6">
              <Stars value={rating} onChange={v => { setRating(v); setError(''); }} />

              <div>
                <label htmlFor="rv-comment" className="mb-1.5 block text-sm font-medium text-brand-navy/70">
                  {t('כמה מילים', 'A few words')}
                </label>
                <textarea id="rv-comment" value={comment} maxLength={1000} rows={4}
                  onChange={e => { setComment(e.target.value); setError(''); }}
                  placeholder={t('איך האיכות? איך המידה יושבת? היית ממליץ?', 'How is the quality? How does it fit? Would you recommend it?')}
                  className="shop-field resize-none py-3" />
              </div>

              <BoughtField value={bought} onChange={setBought} shirt={shirt} onPick={setShirt} />

              <div>
                <p className="mb-1.5 text-sm font-medium text-brand-navy/70">
                  {t('תמונה', 'Photo')} <span className="font-normal text-brand-navy/40">{t('(לא חובה)', '(optional)')}</span>
                </p>
                {preview ? (
                  <div className="relative h-24 w-24">
                    <img src={preview} alt="" className="h-24 w-24 rounded-xl object-cover" />
                    <button type="button" onClick={() => { setFile(null); setPreview(''); }}
                      aria-label={t('הסרת התמונה', 'Remove the photo')}
                      className="absolute -end-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex w-fit cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-brand-navy/25 px-4 py-3 text-sm font-medium text-brand-navy/75 transition hover:border-brand-orange hover:text-brand-orange-ink focus-within:ring-2 focus-within:ring-brand-orange">
                    <ImagePlus className="h-5 w-5" aria-hidden="true" />
                    {t('הוספת תמונה', 'Add a photo')}
                    <input type="file" accept="image/*" className="sr-only"
                      onChange={e => { pickPhoto(e.target.files?.[0]); e.target.value = ''; }} />
                  </label>
                )}
              </div>

              <div>
                <label htmlFor="rv-name" className="mb-1.5 block text-sm font-medium text-brand-navy/70">
                  {t('השם שיופיע', 'Name shown')} <span className="font-normal text-brand-navy/40">{t('(לא חובה)', '(optional)')}</span>
                </label>
                <input id="rv-name" value={name} onChange={e => setName(e.target.value)} maxLength={60}
                  placeholder={t('איך שתרצו שנקרא לכם', 'However you want to be called')} className="shop-field" />
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-brand-navy/70">
                  <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)}
                    className="h-4 w-4 accent-brand-orange" />
                  {t('לפרסם בלי שם', 'Post without a name')}
                </label>
              </div>
            </div>

            {/* Offered, never required: it is what turns the review into a
                verified purchase and attaches it to the order. */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-brand-line">
              <button type="button" onClick={() => setOrderOpen(o => !o)} aria-expanded={orderOpen}
                className="flex min-h-[3.5rem] w-full items-center gap-3 bg-brand-mist px-4 text-start">
                <Check className="h-5 w-5 flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-brand-navy">{t('לסמן את הביקורת כרכישה מאומתת', 'Mark the review as a verified purchase')}</span>
                  <span className="block text-[12px] text-brand-navy/55">{t('לא חובה · הטלפון והאימייל מההזמנה', 'Optional · the phone and email from your order')}</span>
                </span>
                <ChevronDown className={`h-4 w-4 flex-shrink-0 text-brand-navy/40 transition-transform ${orderOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {orderOpen && (
                <div className="space-y-3 bg-white px-4 pb-4 pt-3">
                  <div>
                    <label htmlFor="rv-phone" className="mb-1.5 block text-sm font-medium text-brand-navy/70">{t('טלפון', 'Phone')}</label>
                    <input id="rv-phone" value={phone} onChange={e => setPhone(e.target.value)} type="tel" dir="ltr"
                      maxLength={20} autoComplete="tel" className="shop-field text-start" />
                  </div>
                  <div>
                    <label htmlFor="rv-email" className="mb-1.5 block text-sm font-medium text-brand-navy/70">{t('אימייל', 'Email')}</label>
                    <input id="rv-email" value={email} onChange={e => setEmail(e.target.value)} type="email" dir="ltr"
                      maxLength={254} autoComplete="email" className="shop-field text-start" />
                  </div>
                  <p className="text-[12px] leading-relaxed text-brand-navy/55">
                    {t('אם הם תואמים להזמנה, הביקורת תסומן כרכישה מאומתת ותופיע גם בדף החולצה שקנית.',
                       'If they match an order, the review is marked as a verified purchase and appears on the shirt you bought.')}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div role="alert" className="mt-4 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-[14px] leading-relaxed text-red-700 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <p>{error}</p>
              </div>
            )}

            <button type="submit" disabled={busy} className="shop-btn mt-5 min-h-[3.25rem] w-full" aria-busy={busy}>
              {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Star className="h-5 w-5" aria-hidden="true" />}
              {busy ? t('שולח...', 'Sending...') : t('שליחת הדירוג', 'Send review')}
            </button>
            <p className="mt-2 text-center text-xs text-brand-navy/50">
              {t('הביקורת תופיע באתר אחרי שנעבור עליה.', "Reviews appear once we've looked them over.")}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
