import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '@/components/Seo';
import { SITE_ORIGIN } from '@/lib/siteUrl';
import { t } from '@/lib/i18n';
import { SizeChartTabs, SizeChartTable, SizeTips, SizeCalculator } from '@/components/product/SizeChart';

export default function SizeGuide() {
  const [tab, setTab] = useState('fan');

  return (
    <div className="shop-container py-8 lg:py-14">
      <Seo title="מדריך מידות - JerseyLab" description="מדריך מידות לחולצות כדורגל: טבלאות מידות לאוהד, גרסת שחקן, נשים וילדים. איך לבחור את המידה הנכונה לפי מידות הגוף." canonicalPath="/size-guide" jsonLd={{ "@context": "https://schema.org", "@type": "WebPage", name: "מדריך מידות - JerseyLab", description: "מדריך מידות לחולצות כדורגל וטבלאות מידה.", url: (SITE_ORIGIN) + "/size-guide", inLanguage: "he-IL" }} />

      <div className="mx-auto max-w-4xl">
        <nav aria-label={t('נתיב ניווט', 'Breadcrumb')} className="shop-eyebrow">
          <Link to="/" className="hover:text-brand-navy">{t('דף הבית', 'Home')}</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span className="text-brand-navy/70">{t('מדריך מידות', 'Size guide')}</span>
        </nav>

        <h1 className="shop-title mt-3">{t('מדריך מידות', 'Size guide')}</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-brand-navy/65">
          {t('בחרו גרסה ומצאו את המידה לפי הטבלה. גרסת שחקן צמודה יותר מגרסת אוהד.', 'Choose a version and find your size in the table. The player version is a closer fit than the fan version.')}
        </p>

        <div className="mt-8">
          <SizeChartTabs value={tab} onChange={setTab} />
        </div>
        {(tab === 'fan' || tab === 'player') && (
          <div className="mt-5">
            <SizeCalculator tab={tab} />
          </div>
        )}
        <div className="mt-5">
          <SizeChartTable tab={tab} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-3xl bg-brand-mist p-6 sm:p-8">
            <SizeTips />
          </div>
          <div className="flex flex-col justify-between gap-6 rounded-3xl bg-brand-navy p-6 text-white sm:p-8">
            <div>
              <h2 className="text-xl font-semibold">{t('לא בטוחים באיזו מידה לבחור?', 'Not sure which size to choose?')}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-white/70">
                {t('כתבו לנו גובה, משקל ואיזו גזרה אתם אוהבים, ונמליץ על מידה.', "Send us your height, weight and the fit you like, and we'll recommend a size.")}
              </p>
            </div>
            <Link to="/contact" className="shop-btn self-start">{t('צרו קשר', 'Contact us')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
