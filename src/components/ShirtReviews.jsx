import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Loader2, Check, Lock, ImagePlus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { friendlyError } from '@/lib/errorMessages';
import { t } from '@/lib/i18n';

function StarRating({ rating, onSelect, interactive = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5" aria-label={interactive ? t('דירוג', 'Rating') : t(`${rating} מתוך 5`, `${rating} out of 5`)}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          tabIndex={interactive ? 0 : -1}
          aria-label={interactive ? t(`${s} כוכבים`, `${s} stars`) : undefined}
          onClick={() => interactive && onSelect && onSelect(s)}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default pointer-events-none'}
        >
          <Star className={`h-[1.1rem] w-[1.1rem] ${(hovered || rating) >= s ? 'fill-brand-orange text-brand-orange' : 'text-brand-line'}`} />
        </button>
      ))}
    </div>
  );
}

function Notice({ icon: Icon = Lock, children }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-brand-mist px-4 py-3 text-[13px] text-brand-navy/65">
      <Icon className="h-4 w-4 flex-shrink-0 text-brand-navy/50" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

// The reviews of one shirt, and the form for writing one. Shown inside a row on
// the product page, which supplies the heading; `onSummary` hands it the count
// and the average once they are known.
export default function ShirtReviews({ shirtId, user, onSummary }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [form, setForm] = useState({ rating: 0, comment: '', anonymous: false });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [lightboxImage, setLightboxImage] = useState('');

  useEffect(() => {
    loadData();
  }, [shirtId, user]);

  async function loadData() {
    setLoading(true);
    try {
      const all = await base44.entities.Review.filter({ approved: true, shirt_id: shirtId }, '-created_date', 20);
      setReviews(all);
      onSummary?.({
        count: all.length,
        average: all.length ? all.reduce((s, r) => s + r.rating, 0) / all.length : null,
      });

      // Only a customer with a closed order for this shirt may review it.
      if (user) {
        const closed = await base44.entities.InterestRequest.filter({
          user_id: user.id,
          shirt_id: shirtId,
          status: 'closed',
        });
        setCanReview(closed.length > 0);
      }
    } catch { /* reviews are secondary to the product; the row just stays empty */ }
    finally {
      setLoading(false);
    }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.rating) errs.rating = t('בחרו דירוג', 'Choose a rating');
    if (!form.comment.trim()) errs.comment = t('שדה חובה', 'Required');
    if (form.comment.length > 1000) errs.comment = t('הביקורת ארוכה מדי (עד 1000 תווים)', 'The review is too long (up to 1000 characters)');
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setErrors({});
    try {
      let image_url = '';
      if (image) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: image, bucket: 'review-images' });
        image_url = file_url;
      }
      await base44.entities.Review.create({
        reviewer_name: user.full_name,
        rating: form.rating,
        comment: form.comment,
        approved: false,
        user_id: user.id,
        shirt_id: shirtId,
        image_url,
        is_anonymous: form.anonymous,
      });
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: friendlyError(err, t('שליחת הביקורת נכשלה. נסו שוב בעוד רגע.', "We couldn't send your review. Please try again in a moment.")) });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-14 rounded-2xl skeleton" />;

  return (
    <div className="space-y-4">
      {reviews.length === 0 ? (
        <p className="text-[15px] text-brand-navy/60">{t('עדיין אין ביקורות על החולצה הזו.', 'No reviews of this shirt yet.')}</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold tabular-nums text-brand-navy">{avgRating}</span>
            <div>
              <StarRating rating={Math.round(avgRating)} />
              <p className="mt-0.5 text-[13px] text-brand-navy/55">{t(`${reviews.length} ביקורות`, `${reviews.length} reviews`)}</p>
            </div>
          </div>
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-brand-line p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[15px] font-semibold text-brand-navy">{r.is_anonymous ? t('אנונימי', 'Anonymous') : r.reviewer_name}</span>
                  <StarRating rating={r.rating} />
                </div>
                <p dir="auto" className="mt-2 text-start text-[15px] leading-relaxed text-brand-navy/75">{r.comment}</p>
                {r.image_url && (
                  <button type="button" onClick={() => setLightboxImage(r.image_url)} className="mt-3 block" aria-label={t('הגדלת התמונה', 'Enlarge the photo')}>
                    <img src={r.image_url} alt="" className="h-28 w-28 cursor-zoom-in rounded-xl object-cover transition hover:opacity-90" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {!user ? (
        <Notice>{t('רכשתם את החולצה?', 'Bought this shirt?')} <Link to="/login" className="shop-link">{t('התחברו', 'Log in')}</Link> {t('כדי לכתוב ביקורת.', 'to write a review.')}</Notice>
      ) : !canReview ? (
        <Notice>{t('רק לקוחות שרכשו את החולצה יכולים לכתוב עליה ביקורת.', 'Only customers who bought this shirt can review it.')}</Notice>
      ) : submitted ? (
        <Notice icon={Check}>{t('תודה! הביקורת תפורסם אחרי אישור.', 'Thank you! Your review will appear once it is approved.')}</Notice>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-brand-line p-4 sm:p-5">
          <p className="text-[15px] font-semibold text-brand-navy">{t('כתיבת ביקורת', 'Write a review')}</p>
          <div>
            <p className="mb-1.5 text-sm text-brand-navy/60">{t('דירוג', 'Rating')}</p>
            <StarRating rating={form.rating} interactive onSelect={r => { setForm(p => ({ ...p, rating: r })); setErrors(p => ({ ...p, rating: undefined })); }} />
            {errors.rating && <p className="mt-1 text-xs text-red-600">{errors.rating}</p>}
          </div>
          <div>
            <label htmlFor="review-comment" className="mb-1.5 block text-sm text-brand-navy/60">{t('הביקורת שלכם', 'Your review')}</label>
            <textarea id="review-comment" value={form.comment} maxLength={1000} rows={3}
              onChange={e => { setForm(p => ({ ...p, comment: e.target.value })); setErrors(p => ({ ...p, comment: undefined })); }}
              className={`shop-field resize-none py-3 ${errors.comment ? 'border-red-300' : ''}`} />
            {errors.comment && <p className="mt-1 text-xs text-red-600">{errors.comment}</p>}
          </div>
          <div>
            <p className="mb-1.5 text-sm text-brand-navy/60">{t('תמונה (לא חובה)', 'Photo (optional)')}</p>
            {imagePreview ? (
              <div className="relative h-20 w-20">
                <img src={imagePreview} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <button type="button" onClick={() => { setImage(null); setImagePreview(''); }} aria-label={t('הסרת התמונה', 'Remove the photo')}
                  className="absolute -end-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-navy text-white">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex w-fit cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-brand-navy/25 px-4 py-2.5 text-sm text-brand-navy/70 transition hover:border-brand-navy/50">
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                {t('הוספת תמונה', 'Add a photo')}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setImage(f);
                  setImagePreview(URL.createObjectURL(f));
                }} />
              </label>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-navy/70">
            <input type="checkbox" checked={form.anonymous} onChange={(e) => setForm(p => ({ ...p, anonymous: e.target.checked }))} className="h-4 w-4 accent-brand-orange" />
            {t('פרסום כאנונימי (השם שלי לא יוצג)', "Post anonymously (my name won't be shown)")}
          </label>
          <button type="submit" disabled={submitting} className="shop-btn">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? t('שולח...', 'Sending...') : t('שליחת הביקורת', 'Send review')}
          </button>
          {errors.submit && <p className="text-xs text-red-600">{errors.submit}</p>}
        </form>
      )}

      {lightboxImage && (
        <div
          role="button"
          tabIndex={0}
          aria-label={t('סגירת התמונה', 'Close the photo')}
          onClick={() => setLightboxImage('')}
          onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') setLightboxImage(''); }}
          className="fixed inset-0 z-[80] flex cursor-zoom-out items-center justify-center bg-brand-navy-dark/85 p-6"
        >
          <img src={lightboxImage} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
}
