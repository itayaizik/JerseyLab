import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { t } from '@/lib/i18n';

// "Added to the cart", in the middle of the screen, for a moment.
//
// The only sign a tap had landed used to be the number on the basket in the
// corner, which on a phone is far from the thumb that just pressed the button
// and easy to miss entirely. A tap you are not sure about gets made twice, and
// then there are two shirts in the cart.
//
// It listens for the event lib/cart fires, so it covers every way into the
// cart - a product page, the quick-add window, the mystery box - without any of
// them knowing about it. It is deliberately not a dialog: it takes no focus,
// swallows no clicks and needs no dismissing.

const SHOWN_MS = 1500;

export default function AddedToCart() {
  const [item, setItem] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    const onAdded = (e) => {
      setItem({ at: Date.now(), name: e.detail?.shirtName || '', size: e.detail?.size || '' });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setItem(null), SHOWN_MS);
    };
    window.addEventListener('cart_added', onAdded);
    return () => {
      window.removeEventListener('cart_added', onAdded);
      clearTimeout(timer.current);
    };
  }, []);

  if (!item) return null;

  return createPortal(
    <div aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center p-6">
      {/* `key` restarts the animation when a second shirt is added while the
          first confirmation is still on screen. */}
      <div key={item.at} className="jl-added flex max-w-[16rem] flex-col items-center gap-3 rounded-3xl bg-brand-navy/95 px-7 py-6 text-center shadow-lift">
        <span className="jl-added-mark flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange">
          <Check className="h-8 w-8 text-white" strokeWidth={3} />
        </span>
        <span className="text-[15px] font-bold text-white">{t('נוסף לסל', 'Added to the cart')}</span>
        {item.name && (
          <span className="line-clamp-2 text-[13px] leading-snug text-white/70">
            {item.name}{item.size ? ` · ${item.size}` : ''}
          </span>
        )}
      </div>
    </div>,
    document.body,
  );
}

// A screen reader gets the same news as plain text, since the panel above is
// hidden from it. Mounted separately so it can stay in the page and simply
// change, which is what a live region needs in order to be read out.
export function AddedToCartAnnouncer() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    let timer;
    const onAdded = (e) => {
      const name = e.detail?.shirtName || '';
      setMessage(t(`${name} נוסף לסל`, `${name} added to the cart`).trim());
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(''), 3000);
    };
    window.addEventListener('cart_added', onAdded);
    return () => { window.removeEventListener('cart_added', onAdded); clearTimeout(timer); };
  }, []);

  return <p role="status" aria-live="polite" className="sr-only">{message}</p>;
}
