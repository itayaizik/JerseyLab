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

const SETTING_KEYS = {
  active: 'topbar_active',
  text: 'topbar_text',
  linkText: 'topbar_link_text',
  linkHref: 'topbar_link_href',
};

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
        setPromo({
          text,
          linkText: (map[key('linkText')] || '').trim(),
          linkHref: (map[SETTING_KEYS.linkHref] || '').trim(),
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

  // The darker orange rather than the accent itself: this is small white text,
  // and on the accent it falls short of a readable contrast.
  return (
    <div className="bg-brand-orange-ink text-white">
      <div className="shop-container flex min-h-[2.25rem] items-center gap-2 py-1.5">
        <span className="w-8 flex-shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-center text-[13px] font-medium leading-snug">
          {promo.text}
          {promo.linkText && promo.linkHref && (
            <>
              {' '}
              <Link to={promo.linkHref} className="font-semibold underline underline-offset-2 hover:opacity-85">
                {promo.linkText}
              </Link>
            </>
          )}
        </p>
        <button type="button" onClick={close} aria-label={t('סגירת ההודעה', 'Close this notice')}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition hover:bg-white/15">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
