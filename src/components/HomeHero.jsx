import React from 'react';
import { Link } from 'react-router-dom';

// The first thing on the home page: one photograph with a small white card over
// it, the way the big club stores open. Everything is editable from ניהול >
// הגדרות אתר - both photos, the card's text, the link, or no card at all.

const DEFAULTS = {
  desktop: '/hero-desktop.jpg',
  mobile: '/hero-mobile.jpg',
  title: 'חולצות כדורגל|לכל הקבוצות',
  subtitle: 'קבוצות, נבחרות ורטרו במקום אחד.',
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
  const desktop = settings.homepage_hero_image || DEFAULTS.desktop;
  // An uploaded desktop photo with no phone version is used on phones too,
  // rather than the default phone photo sitting beside a different desktop one.
  const mobile = settings.homepage_hero_image_mobile || (settings.homepage_hero_image ? desktop : DEFAULTS.mobile);
  const link = settings.homepage_hero_link || DEFAULTS.link;
  const showCard = settings.homepage_hero_card !== 'no';
  const title = settings.homepage_hero_title || DEFAULTS.title;
  const subtitle = settings.homepage_hero_subtitle ?? DEFAULTS.subtitle;
  const button = settings.homepage_hero_button_text || DEFAULTS.button;

  return (
    <section className="shop-container pt-3 sm:pt-6" aria-label="באנר ראשי">
      <div className="relative overflow-hidden rounded-3xl bg-brand-navy sm:rounded-[2rem]">
        <picture>
          <source media="(min-width: 768px)" srcSet={desktop} />
          {/* React 18 only passes the lowercase attribute through. */}
          {/* eslint-disable-next-line react/no-unknown-property */}
          <img src={mobile} alt="" fetchpriority="high"
            className="aspect-[4/5] w-full object-cover md:aspect-[16/8] lg:aspect-[2.2/1]" />
        </picture>

        {/* The whole photo is a way in; the card's button sits above it. */}
        <Link to={link} aria-label={button} tabIndex={showCard ? -1 : undefined} className="absolute inset-0" />

        {showCard && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 md:inset-x-auto md:bottom-auto md:start-8 md:top-1/2 md:-translate-y-1/2 lg:start-12">
            {/* On a phone the card is one slim row under the shirts: the title
                beside the button, no subtitle. */}
            <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-[1.25rem] bg-white/95 p-3.5 ps-4 shadow-float backdrop-blur md:block md:w-[22rem] md:rounded-[1.5rem] md:p-8 lg:w-[26rem] lg:p-10">
              <h1 className="text-xl font-bold leading-[1.15] tracking-[-0.02em] text-brand-navy md:text-4xl lg:text-5xl">
                <Title text={title} />
              </h1>
              {subtitle && (
                <p className="hidden text-lg leading-relaxed text-brand-navy/65 md:mt-4 md:block">{subtitle}</p>
              )}
              <Link to={link} className="shop-btn flex-shrink-0 px-5 md:mt-7 md:px-8">{button}</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
