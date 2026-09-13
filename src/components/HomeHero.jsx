import React from 'react';
import { Link } from 'react-router-dom';

// The first thing on the home page: one photograph across the whole screen with
// a tall white card over it, the way the Real Madrid store opens. Everything is
// editable from ניהול > הגדרות אתר - both photos, the card's text, the link, or
// no card at all.

export const HERO_DEFAULTS = {
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
    <section aria-label="באנר ראשי">
      {/* Edge to edge, and tall enough to fill the screen under the header. */}
      <div className="relative h-[calc(100svh-10rem)] max-h-[52rem] min-h-[30rem] overflow-hidden bg-brand-navy md:h-[calc(100svh-7rem)] md:min-h-[34rem] md:max-h-[58rem]">
        <picture>
          <source media="(min-width: 768px)" srcSet={desktop} />
          {/* React 18 only passes the lowercase attribute through. */}
          {/* eslint-disable-next-line react/no-unknown-property */}
          <img src={mobile} alt="" fetchpriority="high" className="absolute inset-0 h-full w-full object-cover" />
        </picture>

        {/* The whole photo is a way in; the card's button sits above it. */}
        <Link to={link} aria-label={button} tabIndex={showCard ? -1 : undefined} className="absolute inset-0" />

        {showCard && (
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-end p-4 sm:p-6 md:items-center md:ps-10 lg:ps-16 xl:ps-24">
            {/* A tall, narrow card: the title stacks down it in big type and the
                button sits at the foot. */}
            <div className="pointer-events-auto flex w-[16rem] flex-col rounded-[1.75rem] bg-white/95 p-6 shadow-float backdrop-blur sm:w-[18rem] md:min-h-[26rem] md:w-[22rem] md:p-9 lg:min-h-[30rem] lg:w-[25rem] lg:p-11">
              <h1 className="text-[2.1rem] font-bold leading-[1.05] tracking-[-0.02em] text-brand-navy md:text-5xl lg:text-[3.5rem]">
                <Title text={title} />
              </h1>
              {subtitle && (
                <p className="mt-3 text-[15px] leading-relaxed text-brand-navy/65 md:mt-5 md:text-lg">{subtitle}</p>
              )}
              <div className="mt-5 md:mt-auto md:pt-8">
                <Link to={link} className="shop-btn px-7 md:px-9">{button}</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
