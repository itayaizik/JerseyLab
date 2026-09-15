import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionHeader from '@/components/shop/SectionHeader';
import ScrollRow from '@/components/shop/ScrollRow';
import { t, isEn } from '@/lib/i18n';

// Conversations with customers, shown as social proof, and alongside them the
// photo reviews the owner picked for this row.
//
// The whole section is driven from the admin panel: it appears when there is
// at least one active screenshot or picked review and disappears when there
// are none, so the shop owner can turn it on, fill it, reorder it or empty it
// without anyone touching the code.

export default function ChatProofsSection({ title }) {
  const [proofs, setProofs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // Loaded separately, so one failing (a column not yet added, say) does not
    // take the other down with it.
    base44.entities.ChatProof.filter({ active: true }, 'sort_order', 24)
      .then(data => { if (!cancelled) setProofs(data); })
      .catch(() => {});
    base44.entities.Review.filter({ approved: true, show_in_proofs: true }, '-created_date', 24)
      .then(data => { if (!cancelled) setReviews(data.filter(r => r.image_url)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => { if (e.key === 'Escape') setLightbox(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightbox]);

  // Nothing to show means no empty section and no stray heading.
  if (!proofs.length && !reviews.length) return null;

  // Says where they came from rather than insisting they are genuine.
  // Protesting that screenshots are real invites the opposite thought; naming
  // the source is a fact the reader can check for themselves.
  const subtitle = proofs.length && reviews.length
    ? t('צילומי שיחות מהוואטסאפ ותמונות ששלחו לקוחות. לחצו להגדלה.', 'WhatsApp screenshots and photos sent by customers. Tap to enlarge.')
    : proofs.length
      ? t('צילומי מסך מהוואטסאפ. לחצו כדי לקרוא.', 'Screenshots from WhatsApp. Tap to read.')
      : t('תמונות ששלחו לקוחות. לחצו להגדלה.', 'Photos sent by customers. Tap to enlarge.');
  const heading = title || t('לקוחות מספרים', 'From our customers');

  return (
    <section className="mt-16 sm:mt-24" aria-labelledby="chat-proofs-heading">
      <div className="shop-container">
        <SectionHeader id="chat-proofs-heading" title={heading} subtitle={subtitle} />

        {/* A screenshot of a conversation is a picture of text, so the card has
            to be wide enough to read some of it, and the crop is centred rather
            than anchored to the top: the top of a WhatsApp screenshot is the
            battery icon and a scribbled-out name, and the messages are below. */}
        <div className="mt-10">
          <ScrollRow label={heading} itemClassName="w-[300px] sm:w-[360px]">
            {[
              ...proofs.map(proof => (
                <figure key={proof.id} className="h-full">
                  <button type="button" onClick={() => setLightbox({ image: proof.image_url, caption: proof.caption })} aria-label={t('הגדלת צילום השיחה', 'Enlarge the conversation')}
                    className="block w-full cursor-zoom-in rounded-3xl bg-white p-2 shadow-card transition-shadow hover:shadow-lift">
                    <img src={proof.image_url} alt={proof.caption || t('שיחה עם לקוח', 'A conversation with a customer')} loading="lazy"
                      className="h-[420px] w-full rounded-[1.25rem] object-cover object-center" />
                  </button>
                  {/* Captions are typed in Hebrew in the admin, so the English
                      site shows the screenshots without them. */}
                  {proof.caption && !isEn && (
                    <figcaption className="mt-3 px-2 text-[13px] leading-snug text-brand-navy/65">{proof.caption}</figcaption>
                  )}
                </figure>
              )),
              ...reviews.map(review => {
                const name = review.is_anonymous ? t('לקוח', 'Customer') : (review.reviewer_name || t('לקוח', 'Customer'));
                return (
                  <figure key={`review-${review.id}`} className="flex h-full flex-col rounded-3xl bg-white p-2 shadow-card">
                    <button type="button" onClick={() => setLightbox({ image: review.image_url, caption: review.comment })} aria-label={t('הגדלת התמונה', 'Enlarge the photo')}
                      className="block w-full cursor-zoom-in">
                      <img src={review.image_url} alt={t(`תמונה ששלח ${name}`, `Photo sent by ${name}`)} loading="lazy"
                        className="h-[300px] w-full rounded-[1.25rem] object-cover transition hover:opacity-95" />
                    </button>
                    <figcaption className="flex flex-1 flex-col px-3 pb-3 pt-3.5">
                      <span className="flex gap-0.5" aria-label={t(`${review.rating} מתוך 5`, `${review.rating} out of 5`)}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-4 w-4 ${s <= review.rating ? 'fill-brand-orange text-brand-orange' : 'text-brand-line'}`} aria-hidden="true" />
                        ))}
                      </span>
                      {review.comment && (
                        <span lang="he" dir="rtl" className="mt-2 line-clamp-2 text-start text-[14px] leading-snug text-brand-navy/80">"{review.comment}"</span>
                      )}
                      <span className="mt-auto pt-2 text-[13px] font-semibold text-brand-navy/55">{name}</span>
                    </figcaption>
                  </figure>
                );
              }),
            ]}
          </ScrollRow>
        </div>
      </div>

      {lightbox && (
        <div role="dialog" aria-modal="true" aria-label={t('תמונה מוגדלת', 'Enlarged photo')}
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[80] flex cursor-zoom-out items-center justify-center bg-brand-navy-dark/85 p-4">
          <button type="button" onClick={() => setLightbox(null)} aria-label={t('סגירה', 'Close')}
            className="absolute end-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-navy shadow-lift transition hover:bg-brand-orange hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <figure className="flex max-h-full flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <img src={lightbox.image} alt={lightbox.caption || ''}
              className="max-h-[80vh] max-w-full rounded-2xl object-contain" />
            {lightbox.caption && (
              <figcaption className="max-w-lg text-center text-sm text-white/85">{lightbox.caption}</figcaption>
            )}
          </figure>
        </div>
      )}
    </section>
  );
}
