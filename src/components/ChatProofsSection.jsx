import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Star, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionHeader from '@/components/shop/SectionHeader';
import ScrollRow from '@/components/shop/ScrollRow';
import ProductImage from '@/components/ui/ProductImage';
import { MYSTERY_BOX_ID } from '@/lib/mysteryBox';
import { t, isEn } from '@/lib/i18n';
import { resized } from '@/lib/imageUrl';

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
  const [shirts, setShirts] = useState({});
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // Loaded separately, so one failing (a column not yet added, say) does not
    // take the other down with it.
    base44.entities.ChatProof.filter({ active: true }, 'sort_order', 24)
      .then(data => { if (!cancelled) setProofs(data); })
      .catch(() => {});
    base44.entities.Review.filter({ approved: true, show_in_proofs: true }, '-created_date', 24)
      .then(async data => {
        if (cancelled) return;
        setReviews(data);
        // The shirts these reviews are about, so each card can show what was
        // bought and lead to it. Fetched one by one, the way the wishlist does
        // it, because the entity filter only matches on equality; the ids are
        // deduplicated first, so a row of reviews of the same shirt is one
        // request rather than twenty.
        const ids = [...new Set(data.map(r => r.shirt_id).filter(id => id && id !== MYSTERY_BOX_ID))];
        const found = await Promise.all(ids.map(id => base44.entities.Shirt.get(id).catch(() => null)));
        if (cancelled) return;
        setShirts(Object.fromEntries(found.filter(Boolean).map(sh => [sh.id, sh])));
      })
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
    ? t('צילומי שיחות מהוואטסאפ וביקורות של לקוחות על מה שהזמינו.', 'WhatsApp screenshots, and customers on what they ordered.')
    : proofs.length
      ? t('צילומי מסך מהוואטסאפ. לחצו כדי לקרוא.', 'Screenshots from WhatsApp. Tap to read.')
      : t('ביקורות של לקוחות על מה שהזמינו.', 'Customers on what they ordered.');
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
                    <img src={resized(proof.image_url, 720)} alt={proof.caption || t('שיחה עם לקוח', 'A conversation with a customer')} loading="lazy" width="360" height="420"
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
                const mystery = review.shirt_id === MYSTERY_BOX_ID;
                const shirt = shirts[review.shirt_id];
                // What the card shows at the top: the customer's own photo when
                // they sent one, and otherwise the shirt they are reviewing, so
                // a review without a photo still earns its place in the row.
                const shot = review.image_url || shirt?.main_image || '';
                const ownPhoto = Boolean(review.image_url);
                const href = mystery ? '/mystery-box' : shirt ? `/shirt/${shirt.id}` : '';
                const label = mystery ? t('מיסטרי בוקס', 'Mystery box') : shirt?.name;
                return (
                  <figure key={`review-${review.id}`} className="flex h-full flex-col rounded-3xl bg-white p-2 shadow-card">
                    {!shot && (
                      // A review of something with no picture at all, the
                      // mystery box being the one that has none by design.
                      // Without this the card collapses to its text and breaks
                      // the rhythm of the row.
                      <div aria-hidden="true" className="flex h-[300px] w-full items-center justify-center rounded-[1.25rem] bg-brand-mist">
                        <Star className="h-16 w-16 fill-brand-navy/10 text-brand-navy/10" />
                      </div>
                    )}
                    {shot && (ownPhoto ? (
                      <button type="button" onClick={() => setLightbox({ image: shot, caption: review.comment })} aria-label={t('הגדלת התמונה', 'Enlarge the photo')}
                        className="block w-full cursor-zoom-in">
                        <img src={resized(shot, 720)} alt={t(`תמונה ששלח ${name}`, `Photo sent by ${name}`)} loading="lazy" width="360" height="300"
                          className="h-[300px] w-full rounded-[1.25rem] object-cover transition hover:opacity-95" />
                      </button>
                    ) : (
                      // The shirt's own photo is not the customer's, so it leads
                      // to the product rather than opening as a snapshot.
                      <Link to={href || '/catalog'} className="block w-full">
                        <img src={resized(shot, 720)} alt={label || ''} loading="lazy" width="360" height="300"
                          className="h-[300px] w-full rounded-[1.25rem] bg-brand-mist object-cover transition hover:opacity-95" />
                      </Link>
                    ))}
                    <figcaption className="flex flex-1 flex-col px-3 pb-3 pt-3.5">
                      <span role="img" className="flex gap-0.5" aria-label={t(`${review.rating} מתוך 5`, `${review.rating} out of 5`)}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-4 w-4 ${s <= review.rating ? 'fill-brand-orange text-brand-orange' : 'text-brand-line'}`} aria-hidden="true" />
                        ))}
                      </span>
                      {review.comment && (
                        <span lang="he" dir="rtl" className="mt-2 line-clamp-2 text-start text-[14px] leading-snug text-brand-navy/80">"{review.comment}"</span>
                      )}
                      <span className="mt-auto pt-2 text-[13px] font-semibold text-brand-navy/55">{name}</span>

                      {/* What they bought, and the way in. Shown under every
                          review, including the ones whose picture already is the
                          shirt: the picture is not a link people expect, and a
                          named row is. */}
                      {href && label && (
                        <Link to={href} className="mt-3 flex items-center gap-2.5 rounded-2xl bg-brand-mist p-2 transition hover:bg-brand-mist-dark">
                          {/* relative: ProductImage מניח שלד ב-absolute inset-0 מאחורי התמונה,
                              והוא צריך את העוטף הזה כדי לא לברוח ממנו. */}
                          <span className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl bg-white">
                            {!mystery && shirt?.main_image && (
                              <ProductImage src={shirt.main_image} alt="" sizes="44px" className="h-full w-full object-cover" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1 text-start">
                            <span className="block text-[11px] font-semibold uppercase tracking-wide text-brand-navy/45">{t('ההזמנה', 'Ordered')}</span>
                            <span className="block truncate text-[13px] font-semibold text-brand-navy">{label}</span>
                          </span>
                          <ChevronLeft className="h-4 w-4 flex-shrink-0 text-brand-navy/40 rtl:rotate-0 ltr:rotate-180" aria-hidden="true" />
                        </Link>
                      )}
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
            <img src={resized(lightbox.image, 1280)} alt={lightbox.caption || ''}
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
