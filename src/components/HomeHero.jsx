import React from 'react';
import { Link } from 'react-router-dom';

// The first thing on the home page: one photograph in a rounded banner with a
// narrow white card over it on the left. Everything is
// editable from ניהול > הגדרות אתר - both photos, the card's text, the link, or
// no card at all.

export const HERO_DEFAULTS = {
  desktop: '/hero-desktop.jpg',
  mobile: '/hero-mobile.jpg',
  title: 'עונת 26/27|כבר כאן',
  subtitle: 'החולצה של הקבוצה שלך מחכה לך.',
  button: 'לכל החולצות',
  link: '/catalog',
};

function Title({ text }) {
  const lines = text.split('|').map(line => line.trim()).filter(Boolean);
  return lines.map((line, i) => (
    <span key={i} className={`block ${i > 0 ? 'text-brand-orange-ink' : ''}`}>{line}</span>
  ));
}

export default function HomeHero({ settings = {} }) {
  const desktop = settings.homepage_hero_image || HERO_DEFAULTS.desktop;
  // An uploaded desktop photo with no phone version is used on phones too,
  // rather than the default phone photo sitting beside a different desktop one.
  const mobile = settings.homepage_hero_image_mobile || (settings.homepage_hero_image ? desktop : HERO_DEFAULTS.mobile);
  const link = settings.homepage_hero_link || HERO_DEFAULTS.link;
  const showCard = settings.homepage_hero_card !== 'no';
  const title = settings.homepage_hero_title || HERO_DEFAULTS.title;
  const subtitle = settings.homepage_hero_subtitle ?? HERO_DEFAULTS.subtitle;
  const button = settings.homepage_hero_button_text || HERO_DEFAULTS.button;

  return (
    <section className="shop-container pt-3 sm:pt-6" aria-label="באנר ראשי">
      {/* Inside the page margins with rounded corners, a fixed shape rather than
          the height of the screen, so the shirts below start in view. */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-brand-navy sm:aspect-[16/10] sm:rounded-[2rem] md:aspect-[2/1] lg:aspect-[2.3/1]">
        <picture>
          <source media="(min-width: 768px)" srcSet={desktop} />
          {/* React 18 only passes the lowercase attribute through. */}
          {/* eslint-disable-next-line react/no-unknown-property */}
          <img src={mobile} alt="" fetchpriority="high" className="absolute inset-0 h-full w-full object-cover" />
        </picture>

        {/* The whole photo is a way in; the card's button sits above it. */}
        <Link to={link} aria-label={button} tabIndex={showCard ? -1 : undefined} className="absolute inset-0" />

        {showCard && (
          /* On the left, the end side of a right-to-left page. */
          <div className="pointer-events-none absolute inset-y-0 end-0 flex items-end p-3 sm:p-5 md:items-center md:pe-8 lg:pe-12">
            {/* A narrow white card: the title stacks down it and the button
                sits under the line of text. */}
            <div className="pointer-events-auto w-[15rem] rounded-[1.5rem] bg-white/95 p-5 shadow-float backdrop-blur sm:w-[17rem] md:w-[19rem] md:p-8 lg:w-[23rem] lg:p-10">
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
