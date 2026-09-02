import React, { useState, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Real conversations with customers, shown as social proof.
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

  // Nothing to show means no empty section and no stray heading.
  if (!proofs.length) return null;

  return (
    <section className="py-12" style={{ background: '#E8DFC8' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="w-9 h-9 flex-shrink-0 bg-[#1B2A4A] flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[#FFD95A]" />
          </span>
          <h2 className="font-heading font-black text-2xl text-[#1B2A4A] uppercase">
            {title || 'לקוחות מספרים'}
          </h2>
        </div>
        <p className="font-body text-sm text-[#1B2A4A]/60 mb-6 max-w-2xl">
          שיחות אמיתיות עם לקוחות. לחצו על צילום כדי להגדיל.
        </p>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {proofs.map(proof => (
            <figure key={proof.id} className="flex-shrink-0 w-[210px]">
              <button type="button" onClick={() => setLightbox(proof)}
                className="block w-full bg-white border-2 border-[#1B2A4A] p-2 hover:-translate-y-1 transition-transform cursor-zoom-in"
                style={{ boxShadow: '4px 4px 0 #1B2A4A' }}>
                <img src={proof.image_url} alt={proof.caption || 'שיחה עם לקוח'} loading="lazy"
                  className="w-full h-[280px] object-cover object-top" />
              </button>
              {proof.caption && (
                <figcaption className="mt-2 text-xs font-body text-[#1B2A4A]/70 leading-snug">
                  {proof.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>

      {lightbox && (
        <div role="dialog" aria-modal="true" aria-label="צילום שיחה"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out">
          <button type="button" onClick={() => setLightbox(null)} aria-label="סגור"
            className="absolute top-4 left-4 w-11 h-11 flex items-center justify-center bg-white text-[#1B2A4A] hover:bg-[#E8622A] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <figure className="max-h-full flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <img src={lightbox.image_url} alt={lightbox.caption || 'שיחה עם לקוח'}
              className="max-w-full max-h-[80vh] object-contain border-2 border-white" />
            {lightbox.caption && (
              <figcaption className="text-sm text-white/85 font-body text-center max-w-lg">
                {lightbox.caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </section>
  );
}
