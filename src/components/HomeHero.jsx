import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// The first thing on the home page: one photograph in a rounded banner with a
// narrow white card over it on the left. Everything is
// editable from ניהול > הגדרות אתר - both photos, the card's text, the link, or
// no card at all.

export const HERO_DEFAULTS = {
  desktop: '/hero-desktop.jpg',
  mobile: '/hero-mobile.jpg',
  title: 'עונת 26/27|כבר כאן',
  subtitle: 'הגיע הזמן להתחדש. קנה חולצה חדשה לפני שייגמר.',
  button: 'לקטלוג',
  link: '/catalog',
};

function Title({ text }) {
  const lines = text.split('|').map(line => line.trim()).filter(Boolean);
  return lines.map((line, i) => (
    <span key={i} className={`block ${i > 0 ? 'text-brand-orange-ink' : ''}`}>{line}</span>
  ));
}

// The banner's settings from the last visit, so a returning visitor sees the
// current photo at once instead of waiting for the database.
const HERO_KEYS = [
  'homepage_hero_image', 'homepage_hero_image_mobile', 'homepage_hero_link', 'homepage_hero_card',
  'homepage_hero_title', 'homepage_hero_subtitle', 'homepage_hero_button_text',
];
const CACHE_KEY = 'jl_home_hero';

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; }
}

export default function HomeHero({ settings = {}, ready = true }) {
  const [cached] = useState(readCache);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(HERO_KEYS.map(k => [k, settings[k] ?? null]))));
    } catch { /* private mode - the banner just waits for the database next time */ }
  }, [ready, settings]);

  // Nothing is drawn from the defaults until the real settings (or last
  // visit's) are known. Drawing the default photo first flashed it for a
  // moment before swapping in the one the owner uploaded.
  const source = ready ? settings : cached;
  const hasSource = !!source;
  const s = source || {};

  const desktop = s.homepage_hero_image || HERO_DEFAULTS.desktop;
  // An uploaded desktop photo with no phone version is used on phones too,
  // rather than the default phone photo sitting beside a different desktop one.
  const mobile = s.homepage_hero_image_mobile || (s.homepage_hero_image ? desktop : HERO_DEFAULTS.mobile);
  const link = s.homepage_hero_link || HERO_DEFAULTS.link;
  const showCard = s.homepage_hero_card !== 'no';
  const title = s.homepage_hero_title || HERO_DEFAULTS.title;
  const subtitle = s.homepage_hero_subtitle ?? HERO_DEFAULTS.subtitle;
  const button = s.homepage_hero_button_text || HERO_DEFAULTS.button;

  return (
    <section className="shop-container pt-3 sm:pt-6" aria-label="באנר ראשי">
      {/* Inside the page margins with rounded corners, a fixed shape rather than
          the height of the screen, so the shirts below start in view. */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-brand-navy sm:aspect-[16/10] sm:rounded-[2rem] md:aspect-[2/1] lg:aspect-[2.3/1]">
        {hasSource && (
        <picture>
          <source media="(min-width: 768px)" srcSet={desktop} />
          {/* React 18 only passes the lowercase attribute through. */}
          {/* eslint-disable-next-line react/no-unknown-property */}
          <img src={mobile} alt="" fetchpriority="high" className="absolute inset-0 h-full w-full object-cover" />
        </picture>
        )}

        {/* The whole photo is a way in; the card's button sits above it. */}
        <Link to={link} aria-label={button} tabIndex={showCard ? -1 : undefined} className="absolute inset-0" />

        {hasSource && showCard && (
          /* On the left, the end side of a right-to-left page. */
          /* Phone: centred at the foot of the photo. Tablet up: on the left,
             half way down. */
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-3 sm:p-5 md:items-center md:justify-end md:pe-8 lg:pe-12">
            {/* A narrow white card: the title stacks down it and the button
                sits under the line of text. */}
            <div className="pointer-events-auto w-full max-w-[20rem] rounded-[1.5rem] bg-white/95 p-5 text-center shadow-float backdrop-blur md:w-[19rem] md:max-w-none md:p-8 md:text-start lg:w-[23rem] lg:p-10">
              <h1 className="text-[1.75rem] font-bold leading-[1.08] tracking-[-0.02em] text-brand-navy md:text-4xl lg:text-5xl">
                <Title text={title} />
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm leading-relaxed text-brand-navy/65 md:mt-4 md:text-base lg:text-lg">{subtitle}</p>
              )}
              <Link to={link} className="shop-btn mt-4 px-6 md:mt-7 md:px-8">{button}</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
