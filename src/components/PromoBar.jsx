import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { t, isEn } from '@/lib/i18n';

// The strip above the header.
//
// It is what a strip in that position is for: the one offer or notice worth
// interrupting for. Empty by default, edited from ניהול > הגדרות אתר, and
// dismissible - a permanent banner is noise, and noise is what people learn to
// scroll past.
//
// Everything about it is the shop's choice: the words, the colours, whether it
// moves, which way and how fast, and where a click goes. A still strip is the
// default, because movement in the corner of the eye is a cost and should be
// spent deliberately.

const SETTING_KEYS = {
  active: 'topbar_active',
  text: 'topbar_text',
  linkText: 'topbar_link_text',
  linkHref: 'topbar_link_href',
  scroll: 'topbar_scroll',
  direction: 'topbar_direction',
  speed: 'topbar_speed',
  background: 'topbar_bg',
  foreground: 'topbar_fg',
};

// The strip as it has always looked, for a shop that sets no colours: the
// darker orange rather than the accent itself, because this is small white
// text and on the accent it falls short of a readable contrast.
const DEFAULT_BG = 'var(--brand-orange-ink)';
const DEFAULT_FG = '#fff';

// Seconds for one full pass. Slow enough to read a sentence as it goes by.
const DEFAULT_SPEED = 24;
const MIN_SPEED = 4;
const MAX_SPEED = 300;

// Dismissal is remembered per message, so changing the text shows it again to
// everyone who dismissed the previous one.
const dismissKey = (text) => `jerseylab_topbar_${text.slice(0, 40)}`;

export default function PromoBar() {
  const [promo, setPromo] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await base44.entities.SiteSetting.list('-created_date', 100);
        if (cancelled) return;
        const map = {};
        rows.forEach(r => { map[r.key] = r.value; });
        if (map[SETTING_KEYS.active] !== 'yes') return;
        // The English site shows the strip only if it was also written in
        // English (the same settings with _en).
        const key = (name) => (isEn ? `${SETTING_KEYS[name]}_en` : SETTING_KEYS[name]);
        const text = (map[key('text')] || '').trim();
        if (!text) return;

        const seconds = Number(map[SETTING_KEYS.speed]);
        setPromo({
          text,
          linkText: (map[key('linkText')] || '').trim(),
          linkHref: (map[SETTING_KEYS.linkHref] || '').trim(),
          scroll: map[SETTING_KEYS.scroll] === 'yes',
          // Right to left is the direction Hebrew reads in, so it is the one
          // that feels like text rather than like a ticker.
          direction: map[SETTING_KEYS.direction] === 'ltr' ? 'ltr' : 'rtl',
          speed: Number.isFinite(seconds) && seconds > 0
            ? Math.min(MAX_SPEED, Math.max(MIN_SPEED, seconds))
            : DEFAULT_SPEED,
          background: (map[SETTING_KEYS.background] || '').trim() || DEFAULT_BG,
          foreground: (map[SETTING_KEYS.foreground] || '').trim() || DEFAULT_FG,
        });
        try {
          if (localStorage.getItem(dismissKey(text))) setDismissed(true);
        } catch { /* private mode */ }
      } catch { /* the bar simply stays hidden */ }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!promo || dismissed) return null;

  const close = () => {
    setDismissed(true);
    try { localStorage.setItem(dismissKey(promo.text), '1'); } catch { /* private mode */ }
  };

  const hasLink = !!promo.linkHref;

  // The words, with the optional call to action after them. Drawn more than
  // once when the strip moves, so only the first copy is read aloud.
  const Message = ({ aria = true }) => (
    <span dir="auto" className="whitespace-nowrap" {...(aria ? {} : { 'aria-hidden': 'true' })}>
      {promo.text}
      {promo.linkText && (
        <>
          {' '}
          <span className="font-semibold underline underline-offset-2">{promo.linkText}</span>
        </>
      )}
    </span>
  );

  const content = promo.scroll ? (
    // Two identical halves, animated by exactly half the track: when the first
    // reaches where the second began the loop restarts invisibly. The hidden
    // copies are what make it seamless rather than a message that jumps.
    <div className="jl-marquee flex-1 overflow-hidden">
      {/* Laid out left to right whatever the page direction. In an RTL
          container a max-content flex track starts at the right edge and runs
          leftwards, which put the left-to-right keyframe's starting offset
          entirely off screen - the strip rendered and could not be seen. The
          text keeps its own direction, so Hebrew still reads correctly. */}
      <div
        dir="ltr"
        className={`jl-marquee-track ${promo.direction === 'ltr' ? 'jl-marquee-ltr' : 'jl-marquee-rtl'}`}
        style={{ animationDuration: `${promo.speed}s` }}
      >
        {[0, 1].map(half => (
          <div key={half} className="flex shrink-0 items-center gap-16 pr-16" aria-hidden={half === 1 ? 'true' : undefined}>
            {[0, 1, 2].map(i => <Message key={i} aria={half === 0 && i === 0} />)}
          </div>
        ))}
      </div>
    </div>
  ) : (
    <p className="min-w-0 flex-1 text-center text-[13px] font-medium leading-snug">
      <Message />
    </p>
  );

  // A strip with somewhere to go is clickable across its whole width, not just
  // on the few words at the end. The close button stays outside it, or
  // dismissing would follow the link.
  const body = hasLink
    ? <Link to={promo.linkHref} className="flex min-w-0 flex-1 items-center transition hover:opacity-85">{content}</Link>
    : content;

  return (
    <div style={{ backgroundColor: promo.background, color: promo.foreground }}>
      <div className="shop-container flex min-h-[2.25rem] items-center gap-2 py-1.5 text-[13px] font-medium">
        <span className="w-8 flex-shrink-0" aria-hidden="true" />
        {body}
        <button type="button" onClick={close} aria-label={t('סגירת ההודעה', 'Close this notice')}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition hover:bg-black/15">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
