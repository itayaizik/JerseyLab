import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '@/components/Seo';
import CollectionHero from '@/components/catalog/CollectionHero';
import Breadcrumb from '@/components/shop/Breadcrumb';
import { GUIDES } from '@/lib/guides';
import { t } from '@/lib/i18n';

// The four guides, listed. Written in Hebrew (lib/guides).

export default function Guides() {
  return (
    <div>
      <Seo
        title="מדריכים - JerseyLab"
        description="מדריכים על חולצות כדורגל: איך לזהות חולצה מקורית, ההבדל בין גרסת אוהד לגרסת שחקן, חולצות הרטרו המפורסמות, ומה קונים לאוהד."
        canonicalPath="/guides"
        hebrewOnly
      />

      <CollectionHero
        breadcrumb={<Breadcrumb trail={[{ label: t('מדריכים', 'Guides') }]} />}
        title={t('מדריכים', 'Guides')}
        description={t('כל מה ששווה לדעת לפני שקונים חולצה: מקורי מול העתק, גזרות, מידות ורעיונות למתנה.',
          'Everything worth knowing before buying a shirt. Written in Hebrew.')}
      />

      <div className="shop-container">
        <ul className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
          {GUIDES.map(guide => (
            <li key={guide.slug}>
              <Link to={`/guides/${guide.slug}`} className="shop-card block h-full p-6 transition hover:shadow-lift">
                <h2 className="text-lg font-semibold text-brand-navy" lang="he" dir="rtl">{guide.h1}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-brand-navy/65" lang="he" dir="rtl">{guide.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
