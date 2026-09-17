import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ImagePlus, X, Loader2, CheckCircle2, AlertCircle, Heart } from 'lucide-react';
import Seo from '@/components/Seo';
import ProductImage from '@/components/ui/ProductImage';
import { fetchInvite, submitInvite, uploadInvitePhoto } from '@/lib/reviewInvites';
import { MYSTERY_BOX_ID } from '@/lib/mysteryBox';
import { t } from '@/lib/i18n';

// The page a customer opens from a review request: each thing they ordered,
// with stars, a few words and a photo. No account - the link is the key.
// Reviews arrive unapproved; the admin publishes them.

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function Stars({ value, onChange, label }) {
  const [hover, setHover] = useState(0);
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" role="radio" aria-checked={value === n}
          aria-label={t(`${n} כוכבים`, `${n} stars`)}
          onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          className="rounded-lg p-0.5">
          <Star className={`h-8 w-8 transition ${(hover || value) >= n ? 'fill-brand-orange text-brand-orange' : 'text-brand-line'}`} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewInvite() {
  const { inviteId } = useParams();
  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [drafts, setDrafts] = useState({});
  const [name, setName] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchInvite(inviteId).then(result => {
      if (cancelled) return;
      if (!result.ok) { setLoadError(result.message); return; }
      setInvite(result);
      setName(result.name || '');
      setDrafts(Object.fromEntries(result.items.map(item => [item.shirt_id, { rating: 0, comment: '', file: null, preview: '' }])));
    });
    return () => { cancelled = true; };
  }, [inviteId]);

  const setDraft = (shirtId, patch) => {
    setError('');
    setDrafts(prev => ({ ...prev, [shirtId]: { ...prev[shirtId], ...patch } }));
  };

  const pickPhoto = (shirtId, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError(t('אפשר להעלות רק תמונות.', 'Only photos can be uploaded.')); return; }
    if (file.size > MAX_PHOTO_BYTES) { setError(t('התמונה גדולה מדי (עד 10MB).', 'The photo is too large (up to 10MB).')); return; }
    setDraft(shirtId, { file, preview: URL.createObjectURL(file) });
  };

  const submit = async (e) => {
    e.preventDefault();
    const ready = invite.items.filter(item => {
      const d = drafts[item.shirt_id];
      return d.rating && d.comment.trim();
    });
    const halfDone = invite.items.find(item => {
      const d = drafts[item.shirt_id];
      return (d.rating || d.comment.trim() || d.file) && !(d.rating && d.comment.trim());
    });
    if (halfDone) {
      setError(t(`ב"${halfDone.name}" חסר ${drafts[halfDone.shirt_id].rating ? 'טקסט' : 'דירוג'}.`,
        `"${halfDone.name}" is missing ${drafts[halfDone.shirt_id].rating ? 'a few words' : 'a rating'}.`));
      return;
    }
    if (!ready.length) {
      setError(t('דרגו וכתבו כמה מילים על לפחות פריט אחד.', 'Rate and write a few words about at least one item.'));
      return;
    }

    setBusy(true);
    setError('');
    try {
      const reviews = [];
      for (const item of ready) {
        const d = drafts[item.shirt_id];
        const image_url = d.file ? await uploadInvitePhoto(inviteId, d.file) : '';
        reviews.push({ shirt_id: item.shirt_id, rating: d.rating, comment: d.comment.trim(), image_url });
      }
      const result = await submitInvite(inviteId, { name: name.trim(), anonymous, reviews });
      if (!result.ok) { setError(result.message); return; }
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError(t('העלאת התמונה נכשלה. נסו תמונה אחרת, או שלחו בלי תמונה.', 'The photo could not be uploaded. Try another one, or send without a photo.'));
    } finally {
      setBusy(false);
    }
  };

  const closed = invite && (invite.used || invite.expired);

  return (
    <div className="shop-container py-8 lg:py-14">
      <Seo title={t('ביקורת על ההזמנה - JerseyLab', 'Review your order - JerseyLab')}
        description={t('ספרו לנו איך החולצה.', 'Tell us how the shirt is.')} canonicalPath="/" noindex />

      <div className="mx-auto max-w-xl">
        {!invite && !loadError && (
          <div className="mt-16 flex justify-center" aria-busy="true">
            <Loader2 className="h-7 w-7 animate-spin text-brand-navy/40" aria-label={t('טוען', 'Loading')} />
          </div>
        )}

        {loadError && (
          <div role="alert" className="mt-8 flex items-start gap-3 rounded-3xl bg-red-50 p-5 text-[15px] text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <p>{loadError}</p>
          </div>
        )}

        {invite && (done || closed) && (
          <div role="status" className="mt-8 rounded-3xl bg-brand-mist p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-orange-ink shadow-card">
              {done ? <Heart className="h-7 w-7" aria-hidden="true" /> : <CheckCircle2 className="h-7 w-7" aria-hidden="true" />}
            </span>
            <h1 className="mt-4 text-2xl font-semibold text-brand-navy">
              {done ? t('תודה רבה!', 'Thank you!') : invite.used ? t('כבר קיבלנו את הביקורת שלכם', "We've already got your review") : t('הקישור כבר לא בתוקף', 'This link has expired')}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-brand-navy/65">
              {done
                ? t('הביקורת התקבלה ותופיע באתר אחרי שנעבור עליה.', "Your review is in, and it'll appear on the site once we've looked it over.")
                : invite.used ? t('תודה! אם תרצו להוסיף משהו, שלחו לנו הודעה.', 'Thank you! If you want to add anything, send us a message.')
                  : t('בקשו מאיתנו קישור חדש ונשמח לשמוע מכם.', "Ask us for a new link - we'd love to hear from you.")}
            </p>
            <Link to="/catalog" className="shop-btn mt-6">{t('לחולצות נוספות', 'More shirts')}</Link>
          </div>
        )}

        {invite && !done && !closed && (
          <form onSubmit={submit} noValidate>
            <h1 className="text-2xl font-semibold text-brand-navy sm:text-3xl">
              {invite.name ? t(`${invite.name}, איך החולצה?`, `${invite.name}, how's the shirt?`) : t('איך החולצה?', "How's the shirt?")}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-brand-navy/65">
              {t('דרגו, כתבו כמה מילים, ואם אפשר הוסיפו תמונה שלכם עם החולצה. לוקח דקה.', 'Rate it, write a few words, and if you can, add a photo of you in it. It takes a minute.')}
            </p>

            <ul className="mt-6 space-y-4">
              {invite.items.map(item => {
                const d = drafts[item.shirt_id];
                const mystery = item.shirt_id === MYSTERY_BOX_ID;
                return (
                  <li key={item.shirt_id} className="shop-card p-5">
                    <div className="flex items-center gap-3">
                      <span className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-brand-mist">
                        {item.image && !mystery && <ProductImage src={item.image} alt="" sizes="64px" className="h-full w-full object-cover" />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold leading-snug text-brand-navy">{item.name}</p>
                        {item.size && <p className="text-[13px] text-brand-navy/55">{t('מידה', 'Size')} <span dir="ltr">{item.size}</span></p>}
                      </div>
                    </div>

                    <div className="mt-4">
                      <Stars value={d.rating} onChange={v => setDraft(item.shirt_id, { rating: v })} label={t(`דירוג ל${item.name}`, `Rating for ${item.name}`)} />
                    </div>

                    <label htmlFor={`rv-${item.shirt_id}`} className="sr-only">{t('הביקורת שלכם', 'Your review')}</label>
                    <textarea id={`rv-${item.shirt_id}`} value={d.comment} maxLength={1000} rows={3}
                      onChange={e => setDraft(item.shirt_id, { comment: e.target.value })}
                      placeholder={mystery
                        ? t('מה יצא לכם? איך האיכות? הייתם מזמינים שוב?', 'What did you get? How is the quality? Would you order again?')
                        : t('איך האיכות? איך המידה יושבת? הייתם ממליצים?', 'How is the quality? How does the size fit? Would you recommend it?')}
                      className="shop-field mt-3 resize-none py-3" />

                    <div className="mt-3">
                      {d.preview ? (
                        <div className="relative h-24 w-24">
                          <img src={d.preview} alt="" className="h-24 w-24 rounded-xl object-cover" />
                          <button type="button" onClick={() => setDraft(item.shirt_id, { file: null, preview: '' })}
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
                            onChange={e => { pickPhoto(item.shirt_id, e.target.files?.[0]); e.target.value = ''; }} />
                        </label>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="shop-card mt-4 space-y-3 p-5">
              <div>
                <label htmlFor="rv-name" className="mb-1.5 block text-sm font-medium text-brand-navy/70">{t('השם שיופיע בביקורת', 'Name shown on the review')}</label>
                <input id="rv-name" value={name} onChange={e => setName(e.target.value)} maxLength={60} autoComplete="given-name" className="shop-field" />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-navy/70">
                <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="h-4 w-4 accent-brand-orange" />
                {t('לפרסם בלי השם שלי', 'Post without my name')}
              </label>
            </div>

            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={busy} className="shop-btn mt-4 min-h-[3.25rem] w-full">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Star className="h-5 w-5" aria-hidden="true" />}
              {busy ? t('שולח...', 'Sending...') : t('שליחת הביקורת', 'Send review')}
            </button>
            <p className="mt-2 text-center text-xs text-brand-navy/50">{t('הביקורת תופיע באתר אחרי שנעבור עליה.', "Reviews appear on the site once we've looked them over.")}</p>
          </form>
        )}
      </div>
    </div>
  );
}
