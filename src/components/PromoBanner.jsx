import React from 'react';
import { Link } from 'react-router-dom';
import { t } from '@/lib/i18n';

// An optional banner on the home page, switched on and written from ניהול >
// הגדרות אתר: a photo across the card with the text on a frosted panel over it.
export default function PromoBanner({ title, subtitle, buttonText, buttonLink, imageUrl, active }) {
  if (!active) return null;

  return (
    <section className="shop-container mt-16 sm:mt-24">
      <div className="relative overflow-hidden rounded-[2rem] bg-brand-navy">
        {imageUrl && <img src={imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="relative flex min-h-[20rem] items-center p-3 sm:p-6 lg:min-h-[26rem]">
          <div className="max-w-xl rounded-[1.75rem] bg-white/85 p-7 backdrop-blur-xl sm:p-10">
            <h2 className="text-3xl font-bold leading-tight tracking-[-0.02em] text-brand-navy sm:text-4xl">
              {title || t('מבצע על חולצות נבחרות', 'National team shirts on sale')}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-brand-navy/70 sm:text-lg">
              {subtitle || t('הנחות מיוחדות לזמן מוגבל.', 'Special prices for a limited time.')}
            </p>
            <Link to={buttonLink || '/catalog?sale=true'} className="shop-btn mt-6">
              {buttonText || t('לחולצות במבצע', 'Shop the sale')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
