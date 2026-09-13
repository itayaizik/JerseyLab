import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionHeader from '@/components/shop/SectionHeader';
import ScrollRow from '@/components/shop/ScrollRow';

// Conversations with customers, shown as social proof.
//
// The whole section is driven from the admin panel: it appears when there is
// at least one active screenshot and disappears when there are none, so the
// shop owner can turn it on, fill it, reorder it or empty it without anyone
// touching the code.

export default function ChatProofsSection({ title }) {
  const [proofs, setProofs] = useState([]);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await base44.entities.ChatProof.filter({ active: true }, 'sort_order', 24);
        if (!cancelled) setProofs(data);
      } catch { /* section simply stays hidden */ }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => { if (e.key === 'Escape') setLightbox(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightbox]);

  // Nothing to show means no empty section and no stray heading.
  if (!proofs.length) return null;

  return (
    <section className="mt-16 sm:mt-24" aria-labelledby="chat-proofs-heading">
      <div className="shop-container">
        {/* Says where they came from rather than insisting they are genuine.
            Protesting that screenshots are real invites the opposite thought;
            naming the source is a fact the reader can check for themselves. */}
        <SectionHeader id="chat-proofs-heading" title={title || 'לקוחות מספרים'} subtitle="צילומי מסך מהוואטסאפ. לחצו כדי לקרוא." />

        {/* A screenshot of a conversation is a picture of text, so the card has
            to be wide enough to read some of it, and the crop is centred rather
            than anchored to the top: the top of a WhatsApp screenshot is the
            battery icon and a scribbled-out name, and the messages are below. */}
        <div className="mt-10">
          <ScrollRow label="צילומי שיחות עם לקוחות" itemClassName="w-[300px] sm:w-[360px]">
            {proofs.map(proof => (
              <figure key={proof.id} className="h-full">
                <button type="button" onClick={() => setLightbox(proof)} aria-label="הגדלת צילום השיחה"
                  className="block w-full cursor-zoom-in rounded-3xl bg-white p-2 shadow-card transition-shadow hover:shadow-lift">
                  <img src={proof.image_url} alt={proof.caption || 'שיחה עם לקוח'} loading="lazy"
                    className="h-[420px] w-full rounded-[1.25rem] object-cover object-center" />
                </button>
                {proof.caption && (
                  <figcaption className="mt-3 px-2 text-[13px] leading-snug text-brand-navy/65">{proof.caption}</figcaption>
                )}
              </figure>
            ))}
          </ScrollRow>
        </div>
      </div>

      {lightbox && (
        <div role="dialog" aria-modal="true" aria-label="צילום שיחה"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[80] flex cursor-zoom-out items-center justify-center bg-brand-navy-dark/85 p-4">
          <button type="button" onClick={() => setLightbox(null)} aria-label="סגירה"
            className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-navy shadow-lift transition hover:bg-brand-orange hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <figure className="flex max-h-full flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <img src={lightbox.image_url} alt={lightbox.caption || 'שיחה עם לקוח'}
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
