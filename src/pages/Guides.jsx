import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '@/components/Seo';
import CollectionHero from '@/components/catalog/CollectionHero';
import Breadcrumb from '@/components/shop/Breadcrumb';
import { GUIDES, localizeGuide } from '@/lib/guides';
import { t, isEn } from '@/lib/i18n';

// The four guides, listed, in the site's language (lib/guides).

export default function Guides() {
  return (
    <div>
      <Seo
        title={t('מדריכים - JerseyLab', 'Guides - JerseyLab')}
        description={t(
          'מדריכים על חולצות כדורגל: איך לזהות חולצה מקורית, ההבדל בין גרסת אוהד לגרסת שחקן, חולצות הרטרו המפורסמות, ומה קונים לאוהד.',
          'Guides to football shirts: how to tell an original from a replica, fan version against player version, the famous retro shirts, and what to buy a fan.',
        )}
        canonicalPath="/guides"
      />

      <CollectionHero
        breadcrumb={<Breadcrumb trail={[{ label: t('מדריכים', 'Guides') }]} />}
        title={t('מדריכים', 'Guides')}
        description={t('כל מה ששווה לדעת לפני שקונים חולצה: מקורי מול העתק, גזרות, מידות ורעיונות למתנה.',
          'Everything worth knowing before buying a shirt: original against replica, cuts, sizes and gift ideas.')}
      />

      <div className="shop-container">
        <ul className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
          {GUIDES.map(source => localizeGuide(source, isEn)).map((guide, i) => (
            <li key={GUIDES[i].slug}>
              <Link to={`/guides/${GUIDES[i].slug}`} className="shop-card block h-full p-6 transition hover:shadow-lift">
                <h2 className="text-lg font-semibold text-brand-navy">{guide.h1}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-brand-navy/65">{guide.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
