import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductImage from '@/components/ui/ProductImage';
import { t } from '@/lib/i18n';

// The top of a catalogue or collection page: a white card with the title, a
// short introduction and links to related categories, beside a panel of shirts
// from the page itself.
//
// The picture panel is held open while the shirts load, so the card does not
// change width under the reader when they arrive.

function mediaClass(i, count) {
  if (i === 0) return count === 1 ? 'col-span-3 row-span-2' : 'col-span-2 row-span-2';
  if (i === 1 && count === 2) return 'row-span-2';
  return '';
}

export default function CollectionHero({ breadcrumb, title, description, chips = [], images = [], loading = false, children }) {
  const [expanded, setExpanded] = useState(false);
  const pictures = images.filter(Boolean).slice(0, 3);
  const showMedia = loading || pictures.length > 0;
  const longText = (description || '').length > 140;

  return (
    <section className="bg-gradient-to-b from-brand-mist via-brand-mist/60 to-white">
      <div className="shop-container py-5 sm:py-8 lg:py-10">
        <div className={`grid items-stretch gap-4 lg:gap-6 ${showMedia ? 'lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]' : ''}`}>
          <div className="flex flex-col justify-center rounded-[2rem] bg-white/90 p-6 shadow-card backdrop-blur sm:p-10 lg:p-12">
            {breadcrumb}
            <h1 className="text-[2.25rem] font-bold leading-[1.05] tracking-[-0.03em] text-brand-navy sm:text-5xl lg:text-[3.5rem]">
              {title}
            </h1>

            {description && (
              <div className="mt-4 max-w-2xl">
                <p className={`text-base leading-relaxed text-brand-navy/75 sm:text-lg ${longText && !expanded ? 'line-clamp-2' : ''}`}>
                  {description}
                </p>
                {longText && (
                  <button type="button" onClick={() => setExpanded(e => !e)} aria-expanded={expanded}
                    className="mt-2 text-[15px] font-medium text-brand-navy/55 transition hover:text-brand-navy">
                    {expanded ? t('הצגת פחות', 'Show less') : t('קריאה נוספת', 'Read more')}
                  </button>
                )}
              </div>
            )}

            {children}

            {chips.length > 0 && (
              <nav aria-label={t('קטגוריות קשורות', 'Related categories')} className="mt-7">
                <ul className="flex flex-wrap gap-2.5 sm:gap-3">
                  {chips.map(chip => (
                    <li key={chip.href}>
                      <Link
                        to={chip.href}
                        aria-current={chip.active ? 'page' : undefined}
                        className={`inline-flex min-h-[2.75rem] items-center rounded-full border px-5 text-[15px] transition sm:min-h-[3rem] sm:px-6 ${
                          chip.active
                            ? 'border-brand-navy bg-brand-navy text-white'
                            : 'border-brand-line bg-white text-brand-navy/75 hover:border-brand-navy/40 hover:text-brand-navy'
                        }`}
                      >
                        {chip.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>

          {showMedia && (
            <div aria-hidden="true" className="hidden min-h-[22rem] grid-cols-3 grid-rows-2 gap-3 overflow-hidden rounded-[2rem] bg-brand-navy p-3 lg:grid">
              {pictures.length > 0
                ? pictures.map((src, i) => (
                  <div key={src} className={`relative overflow-hidden rounded-3xl bg-brand-navy-light ${mediaClass(i, pictures.length)}`}>
                    <ProductImage src={src} alt="" eager={i === 0} ratio="auto" sizes={i === 0 && pictures.length > 1 ? '560px' : '300px'} className="h-full w-full object-cover" />
                  </div>
                ))
                : [0, 1, 2].map(i => (
                  <div key={i} className={`rounded-3xl bg-brand-navy-light ${mediaClass(i, 3)}`} />
                ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
