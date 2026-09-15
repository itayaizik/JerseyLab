import React from 'react';
import { Link } from 'react-router-dom';
import { BOX_TYPES } from '@/lib/mysteryBox';
import { MYSTERY_BOX_PANELS } from '@/components/MysteryBoxInfo';
import Disclosure from '@/components/shop/Disclosure';
import { t } from '@/lib/i18n';

// The mystery box on the home page: the offer on a navy panel, and beside it
// the three questions the product page answers at length - what it is, what
// arrives, and what you can rule out - condensed to what fits without
// scrolling.
//
// It sits after the shirts rather than under the hero: a side product placed
// above the catalogue reads as an interruption, here it reads as a discovery.

// By id rather than by title, since the titles change with the language.
const PROMO_PANEL_IDS = ['what', 'get', 'exclude'];

const promoPanels = PROMO_PANEL_IDS
  .map(id => MYSTERY_BOX_PANELS.find(p => p.id === id))
  .filter(Boolean);

// One line per panel, short enough to scan. Taken from the panel's own copy so
// the two pages cannot drift apart.
function panelLine(panel) {
  if (panel.items?.length) return panel.items[0];
  return panel.paragraphs?.[0] || '';
}

export default function MysteryBoxPromo() {
  return (
    <section className="shop-container mt-16 sm:mt-24" aria-labelledby="mystery-heading">
      <div className="grid overflow-hidden rounded-[2rem] bg-brand-navy lg:grid-cols-2">
        <div className="flex flex-col justify-center p-7 text-white sm:p-12">
          <span className="inline-flex w-fit items-center rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] font-semibold text-brand-gold">
            {t('חדש באתר', 'New')}
          </span>
          <h2 id="mystery-heading" className="mt-5 text-4xl font-bold leading-tight tracking-[-0.02em] sm:text-5xl">{t('מיסטרי בוקס', 'Mystery Box')}</h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
            {t('אתם בוחרים סגנון ומידה, והחולצה יוצאת אקראית. אותה איכות ואותו מחיר כמו בקטלוג, רק בהפתעה.',
              'You choose the style and size, and the shirt comes out at random. The same quality and price as the catalog, just as a surprise.')}
          </p>
          <ul className="mt-6 max-w-sm divide-y divide-white/10 border-y border-white/10">
            {BOX_TYPES.map(box => (
              <li key={box.id} className="flex items-center justify-between py-2.5">
                <span className="text-[15px] text-white/75">{t(box.label, box.labelEn)}</span>
                <span className="text-base font-semibold tabular-nums text-white">₪{box.price}</span>
              </li>
            ))}
          </ul>
          <Link to="/mystery-box" className="shop-btn mt-8 self-start px-8">{t('לבניית הבוקס', 'Build your box')}</Link>
        </div>

        {promoPanels.length > 0 && (
          <div className="p-2.5 sm:p-4 lg:ps-0">
            {/* Phone: the three answers as rows that open, so the offer and its
                button are not pushed a screen away by the cards. */}
            <div className="space-y-2 rounded-3xl bg-white p-2.5 sm:hidden">
              {promoPanels.map(panel => (
                <Disclosure key={panel.id} title={panel.title}>
                  <p className="text-sm leading-relaxed text-brand-navy/65">{panelLine(panel)}</p>
                </Disclosure>
              ))}
            </div>
            <ul className="hidden h-full content-center gap-2.5 sm:grid sm:grid-cols-3 sm:gap-3 lg:grid-cols-1">
              {promoPanels.map(panel => {
                const Icon = panel.icon;
                return (
                  <li key={panel.id} className="flex flex-col rounded-3xl bg-white p-6 lg:flex-row lg:items-start lg:gap-4">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-orange-soft text-brand-orange-ink">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="mt-4 lg:mt-0">
                      <h3 className="text-base font-semibold text-brand-navy">{panel.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-brand-navy/60">{panelLine(panel)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
