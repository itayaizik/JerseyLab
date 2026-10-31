import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { X, Copy, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import LiquidButton from '@/components/shop/LiquidButton';
import { t, isEn } from '@/lib/i18n';

// The offer that opens itself, half a minute into a visit.
//
// A popup is an interruption, so this one is built to earn it and then get out
// of the way:
//
//   - It waits. Thirty seconds is long enough that whoever is still here is
//     reading rather than bouncing, and the timer only starts once, on the
//     first page of the visit - moving between pages does not restart it or
//     show it twice.
//   - It is empty until the shop fills it. Nothing appears unless
//     `discount_popup_active` is "yes" and there is text, so the default state
//     of the site is no popup at all.
//   - Dismissing it is permanent, per offer. The key is the offer's own text,
//     so writing a new offer shows it again to everyone - and keeping the old
//     one never nags a visitor who already said no.
//   - It never opens over the cart or the checkout. Someone with their card
//     out is not the person to interrupt with a coupon.
//
// Edited from ניהול > הגדרות אתר, like the top bar and the home page banner.

const KEYS = {
  active: 'discount_popup_active',
  title: 'discount_popup_title',
  text: 'discount_popup_text',
  code: 'discount_popup_code',
  buttonText: 'discount_popup_button_text',
  link: 'discount_popup_link',
  delay: 'discount_popup_delay',
};

const DEFAULT_DELAY_SECONDS = 30;

// Where a popup would be an interruption rather than an offer: signing in,
// and writing a review of something already bought.
const QUIET_PATHS = [/^\/admin/, /^\/login/, /^\/register/, /^\/reset-password/, /^\/forgot-password/, /^\/review/];

// The cart is a drawer rather than a route, so there is no path to match on.
// Anything already holding the screen - the cart, the quick-add window, the
// size guide - is a conversation in progress, and the offer waits for it.
const SOMETHING_ELSE_IS_OPEN = () =>
  !!document.querySelector('[role="dialog"], [aria-modal="true"], [data-state="open"][role="dialog"]');
const RETRY_MS = 8000;

const dismissKey = (text) => `jerseylab_discount_${String(text).slice(0, 40)}`;

export default function DiscountPopup() {
  const [offer, setOffer] = useState(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  const closeRef = useRef(null);
  const location = useLocation();

  // Read the settings once per visit. The timer is started here too, so it
  // measures time on the site rather than time on the current page.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await base44.entities.SiteSetting.list('-created_date', 100);
        if (cancelled) return;
        const map = {};
        rows.forEach(r => { map[r.key] = r.value; });
        if (map[KEYS.active] !== 'yes') return;

        // The English site shows the popup only if it was also written in
        // English, the same rule the top bar follows.
        const field = (name) => (isEn ? map[`${KEYS[name]}_en`] : map[KEYS[name]]) || '';
        const text = field('text').trim();
        if (!text) return;

        try {
          if (localStorage.getItem(dismissKey(text))) return;
        } catch { /* private mode: show it, dismissing just will not stick */ }

        const seconds = Number(map[KEYS.delay]);
        const delay = Number.isFinite(seconds) && seconds >= 0 ? seconds : DEFAULT_DELAY_SECONDS;

        const show = () => {
          if (SOMETHING_ELSE_IS_OPEN()) {
            timer.current = setTimeout(show, RETRY_MS);
            return;
          }
          setOpen(true);
        };

        const next = {
          title: field('title').trim(),
          text,
          code: (map[KEYS.code] || '').trim(),
          buttonText: field('buttonText').trim(),
          link: (map[KEYS.link] || '').trim(),
        };
        setOffer(next);
        timer.current = setTimeout(show, delay * 1000);
      } catch { /* the popup simply never opens */ }
    })();
    return () => { cancelled = true; clearTimeout(timer.current); };
  }, []);

  const close = () => {
    setOpen(false);
    try { localStorage.setItem(dismissKey(offer.text), '1'); } catch { /* private mode */ }
  };

  // Escape closes it, and the close button takes focus when it opens so a
  // keyboard is not left behind the dialog.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const quiet = QUIET_PATHS.some(re => re.test(location.pathname));
  if (!offer || !open || quiet) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(offer.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable; the code is on screen to read */ }
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
      {/* Clicking away closes it: an offer nobody wants should cost one tap
          anywhere, not a hunt for the X. */}
      <button type="button" aria-label={t('סגירה', 'Close')} onClick={close}
        className="absolute inset-0 cursor-default bg-brand-navy/45 backdrop-blur-[2px]" />

      <div role="dialog" aria-modal="true" aria-labelledby="discount-popup-title"
        className="jl-pop-in relative w-full max-w-sm rounded-[1.75rem] border border-brand-line bg-white p-7 text-center shadow-lift">
        <button ref={closeRef} type="button" onClick={close} aria-label={t('סגירת החלון', 'Close this offer')}
          className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-brand-navy/50 transition hover:bg-brand-mist hover:text-brand-navy">
          <X className="h-4 w-4" />
        </button>

        {offer.title && (
          <h2 id="discount-popup-title" className="text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-brand-navy">
            {offer.title}
          </h2>
        )}
        <p className={`${offer.title ? 'mt-2.5' : ''} text-[15px] leading-relaxed text-brand-navy/70`}>{offer.text}</p>

        {offer.code && (
          <button type="button" onClick={copy}
            className="mt-5 inline-flex items-center gap-2.5 rounded-xl border border-dashed border-brand-orange bg-brand-orange-soft px-5 py-3 transition hover:bg-brand-orange-soft/70">
            <span dir="ltr" className="text-lg font-bold tracking-[0.12em] text-brand-orange-ink">{offer.code}</span>
            {copied
              ? <Check className="h-4 w-4 text-brand-orange-ink" aria-hidden="true" />
              : <Copy className="h-4 w-4 text-brand-orange-ink/70" aria-hidden="true" />}
            <span className="sr-only">{copied ? t('הקוד הועתק', 'Code copied') : t('העתקת הקוד', 'Copy the code')}</span>
          </button>
        )}

        {offer.buttonText && offer.link && (
          <LiquidButton to={offer.link} onClick={close} className="mt-5 w-full">
            {offer.buttonText}
          </LiquidButton>
        )}

        <button type="button" onClick={close} className="mt-4 block w-full text-[13px] text-brand-navy/45 transition hover:text-brand-navy/70">
          {t('לא עכשיו', 'Not now')}
        </button>
      </div>
    </div>,
    document.body,
  );
}
