import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionHeader from '@/components/shop/SectionHeader';
import ScrollRow from '@/components/shop/ScrollRow';
import OrderedRow, { reviewItems, proofItems } from '@/components/shop/OrderedRow';
import useShirtsById from '@/hooks/useShirtsById';
import { MYSTERY_BOX_ID } from '@/lib/mysteryBox';
import { t, isEn } from '@/lib/i18n';
import { resized } from '@/lib/imageUrl';
import PhotoLightbox from '@/components/shop/PhotoLightbox';
import { reviewPhoto } from '@/lib/reviewDisplay';

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
      .then(data => { if (!cancelled) setReviews(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // The shirts both halves of the row are about, so each card can show what
  // was bought and lead to it.
  const shirts = useShirtsById([
    ...reviews.map(r => r.shirt_id),
    ...proofs.flatMap(p => p.shirt_ids || []),
  ]);

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
              ...proofs.map(proof => {
                const bought = proofItems(proof, shirts);
                return (
                  <figure key={proof.id} className="flex h-full flex-col">
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
                    {/* What that conversation ended in, when the admin attached
                        an order to it. */}
                    <OrderedRow items={bought} className="mt-3" />
                  </figure>
                );
              }),
              ...reviews.map(review => {
                const name = review.is_anonymous ? t('לקוח', 'Customer') : (review.reviewer_name || t('לקוח', 'Customer'));
                const bought = reviewItems(review, shirts);
                const shirt = shirts[review.shirt_id];
                // What the card shows at the top: the customer's own photo when
                // they sent one, and otherwise the shirt they are reviewing, so
                // a review without a photo still earns its place in the row.
                const photo = reviewPhoto(review);
                const shot = photo || shirt?.main_image || '';
                const ownPhoto = Boolean(photo);
                const href = review.shirt_id === MYSTERY_BOX_ID ? '/mystery-box' : shirt ? `/shirt/${shirt.id}` : '';
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
                        <img src={resized(shot, 720)} alt={bought[0]?.label || ''} loading="lazy" width="360" height="300"
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
                      <OrderedRow items={bought} className="mt-3" />
                    </figcaption>
                  </figure>
                );
              }),
            ]}
          </ScrollRow>
        </div>
      </div>

      <PhotoLightbox photo={lightbox} onClose={() => setLightbox(null)} />

    </section>
  );
}
