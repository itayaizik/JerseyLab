import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// The strip above the navbar.
//
// It used to be a fixed sentence about the shop that no visitor needed twice,
// and because the navbar is fixed and this was not, the navbar covered it
// entirely — all anyone ever saw was a sliver of orange behind the bar.
//
// It is now what a strip in that position is for: the one offer or notice worth
// interrupting for. Empty by default, edited from ניהול > הגדרות אתר, and
// dismissible — a permanent banner is noise, and noise is what people learn to
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
        const text = (map[SETTING_KEYS.text] || '').trim();
        if (!text) return;
        setPromo({
          text,
          linkText: (map[SETTING_KEYS.linkText] || '').trim(),
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

  return (
    <div className="bg-[#E8622A] text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 flex items-center gap-2 min-h-[36px] py-1.5">
        <Megaphone className="w-3.5 h-3.5 flex-shrink-0 text-[#FFD95A]" aria-hidden="true" />
        <p className="flex-1 min-w-0 text-xs font-body text-center sm:text-right leading-snug">
          {promo.text}
          {promo.linkText && promo.linkHref && (
            <>
              {' '}
              <Link to={promo.linkHref} className="font-bold underline underline-offset-2 hover:text-[#FFD95A] transition-colors">
                {promo.linkText}
              </Link>
            </>
          )}
        </p>
        <button type="button" onClick={close} aria-label="סגור הודעה"
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center hover:bg-white/20 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
