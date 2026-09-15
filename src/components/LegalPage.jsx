import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '@/components/Seo';
import { BUSINESS } from '@/lib/business';
import CollectionHero from '@/components/catalog/CollectionHero';
import Breadcrumb from '@/components/shop/Breadcrumb';
import { t, isEn } from '@/lib/i18n';

// Shared shell for the legal pages, so all six read as one document set rather
// than six pages that happen to sit next to each other.
//
// Deliberately plain: generous line length, real headings, live text. The
// accessibility regulations require the accessibility statement to be an HTML
// page with selectable text rather than a PDF or an image, and the same
// treatment suits the rest.
//
// On the English site the documents themselves stay in Hebrew, which is the
// binding version, and say so; only the page around them is translated.

export const LEGAL_PAGES = [
  { path: '/legal/terms', label: t('תנאי שימוש', 'Terms of use') },
  { path: '/legal/privacy', label: t('מדיניות פרטיות', 'Privacy policy') },
  { path: '/legal/cookies', label: t('עוגיות וכלי מעקב', 'Cookies and tracking') },
  { path: '/legal/shipping', label: t('משלוחים, אספקה וביטול', 'Shipping, delivery and cancellation') },
  { path: '/legal/accessibility', label: t('הצהרת נגישות', 'Accessibility statement') },
  { path: '/legal/business', label: t('פרטי העסק', 'Business details') },
];

export default function LegalPage({ title, description, path, intro, updated, children }) {
  const shownTitle = isEn ? (LEGAL_PAGES.find(p => p.path === path)?.label || title) : title;
  return (
    <div>
      <Seo title={`${shownTitle} — JerseyLab`} description={description} canonicalPath={path} />

      <CollectionHero
        breadcrumb={<Breadcrumb trail={[{ label: t('מידע משפטי', 'Legal') }, { label: shownTitle }]} />}
        title={shownTitle}
        description={isEn ? 'This document is published in Hebrew, which is the binding version. For any question about it, contact us and we will gladly explain in English.' : intro}
      >
        <p className="mt-4 text-sm text-brand-navy/45">
          {t('עודכן לאחרונה:', 'Last updated:')} <span dir="ltr">{updated || BUSINESS.lastUpdated}</span>
        </p>
      </CollectionHero>

      <div className="shop-container">
        <div className="mx-auto mt-8 max-w-3xl">
          <article lang="he" dir="rtl" className="shop-card legal-body p-6 sm:p-10">
            {children}
          </article>

          <nav className="mt-10" aria-labelledby="legal-more">
            <h2 id="legal-more" className="text-lg font-semibold text-brand-navy">{t('מסמכים נוספים', 'More documents')}</h2>
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {LEGAL_PAGES.filter(p => p.path !== path).map(p => (
                <li key={p.path}>
                  <Link to={p.path} className="shop-chip px-5">{p.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}

// Section heading inside a legal document.
export function Section({ title, children }) {
  return (
    <section className="mt-9 first:mt-0">
      <h2 className="mb-3 text-xl font-semibold text-brand-navy">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-brand-navy/75">{children}</div>
    </section>
  );
}

export function Bullets({ items }) {
  return (
    <ul className="list-disc space-y-2 ps-5 marker:text-brand-orange">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

// A fact that the owner still has to supply shows as a marked gap rather than
// silently reading as though the business has no address.
export function Fact({ label, value, fallback = 'יעודכן בקרוב' }) {
  const missing = !value || String(value).startsWith('TODO_');
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 border-b border-brand-line py-2.5 last:border-b-0">
      <dt className="min-w-[140px] font-semibold text-brand-navy">{label}</dt>
      <dd className={missing ? 'text-brand-orange-ink' : 'text-brand-navy/75'}>
        {missing ? fallback : value}
      </dd>
    </div>
  );
}
