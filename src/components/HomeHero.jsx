import React from 'react';
import { Link } from 'react-router-dom';

// The first thing on the home page: one photograph across the whole screen with
// a tall white card over it, the way the Real Madrid store opens. Everything is
// editable from ניהול > הגדרות אתר - both photos, the card's text, the link, or
// no card at all.

export const HERO_DEFAULTS = {
  desktop: '/hero-desktop.jpg',
  mobile: '/hero-mobile.jpg',
  title: 'עונת|26/27|כבר כאן',
  subtitle: 'החולצה של הקבוצה שלך מחכה לך.',
  button: 'לכל החולצות',
  link: '/catalog',
};

// Each | starts a new line, all in the one colour.
function Title({ text }) {
  const lines = text.split('|').map(line => line.trim()).filter(Boolean);
  return lines.map((line, i) => <span key={i} className="block">{line}</span>);
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
          /* On the left, the end side of a right-to-left page. */
          <div className="pointer-events-none absolute inset-y-0 end-0 flex items-end p-4 sm:p-6 md:items-start md:pe-12 md:pt-24 lg:pe-20 lg:pt-28">
            {/* Modelled on the Real Madrid store's banner card: pale, tall and
                narrow, a huge title one word or two to a line with wide
                spacing between them, a short line under it and a big button. */}
            <div className="pointer-events-auto w-[17.5rem] rounded-3xl bg-neutral-100/95 p-7 backdrop-blur sm:w-[20rem] md:w-[23rem] md:p-11 lg:w-[25rem] lg:p-12">
              <h1 className="text-5xl font-bold leading-[1.3] tracking-[-0.02em] text-black md:text-6xl md:leading-[1.35] lg:text-7xl">
                <Title text={title} />
              </h1>
              {subtitle && (
                <p className="mt-5 text-lg leading-[1.6] text-black md:mt-9 md:text-[1.375rem]">{subtitle}</p>
              )}
              <Link to={link}
                className="shop-btn mt-6 h-14 rounded-2xl px-8 text-lg md:mt-10 md:h-[4.25rem] md:px-10 md:text-[1.375rem]">
                {button}
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
