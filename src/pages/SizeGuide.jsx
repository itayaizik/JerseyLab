import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '@/components/Seo';
import { SITE_ORIGIN } from '@/lib/siteUrl';
import { SizeChartTabs, SizeChartTable, SizeTips } from '@/components/product/SizeChart';

export default function SizeGuide() {
  const [tab, setTab] = useState('fan');

  return (
    <div className="shop-container py-8 lg:py-14">
      <Seo title="מדריך מידות - JerseyLab" description="מדריך מידות לחולצות כדורגל: טבלאות מידות לאוהד, גרסת שחקן, נשים וילדים. איך לבחור את המידה הנכונה לפי מידות הגוף." canonicalPath="/size-guide" jsonLd={{ "@context": "https://schema.org", "@type": "WebPage", name: "מדריך מידות - JerseyLab", description: "מדריך מידות לחולצות כדורגל וטבלאות מידה.", url: (SITE_ORIGIN) + "/size-guide", inLanguage: "he-IL" }} />

      <div className="mx-auto max-w-4xl">
        <nav aria-label="נתיב ניווט" className="shop-eyebrow">
          <Link to="/" className="hover:text-brand-navy">דף הבית</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span className="text-brand-navy/70">מדריך מידות</span>
        </nav>

        <h1 className="shop-title mt-3">מדריך מידות</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-brand-navy/65">
          בחרו גרסה ומצאו את המידה לפי הטבלה. גרסת שחקן צמודה יותר מגרסת אוהד.
        </p>

        <div className="mt-8">
          <SizeChartTabs value={tab} onChange={setTab} />
        </div>
        <div className="mt-5">
          <SizeChartTable tab={tab} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-3xl bg-brand-mist p-6 sm:p-8">
            <SizeTips />
          </div>
          <div className="flex flex-col justify-between gap-6 rounded-3xl bg-brand-navy p-6 text-white sm:p-8">
            <div>
              <h2 className="text-xl font-semibold">לא בטוחים באיזו מידה לבחור?</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-white/70">
                כתבו לנו גובה, משקל ואיזו גזרה אתם אוהבים, ונמליץ על מידה.
              </p>
            </div>
            <Link to="/contact" className="shop-btn self-start">צרו קשר</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
