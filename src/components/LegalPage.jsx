import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '@/components/Seo';
import { BUSINESS } from '@/lib/business';
import CollectionHero from '@/components/catalog/CollectionHero';
import Breadcrumb from '@/components/shop/Breadcrumb';

// Shared shell for the legal pages, so all six read as one document set rather
// than six pages that happen to sit next to each other.
//
// Deliberately plain: generous line length, real headings, live text. The
// accessibility regulations require the accessibility statement to be an HTML
// page with selectable text rather than a PDF or an image, and the same
// treatment suits the rest.

export const LEGAL_PAGES = [
  { path: '/legal/terms', label: 'תנאי שימוש' },
  { path: '/legal/privacy', label: 'מדיניות פרטיות' },
  { path: '/legal/cookies', label: 'עוגיות וכלי מעקב' },
  { path: '/legal/shipping', label: 'משלוחים, אספקה וביטול' },
  { path: '/legal/accessibility', label: 'הצהרת נגישות' },
  { path: '/legal/business', label: 'פרטי העסק' },
];

export default function LegalPage({ title, description, path, intro, updated, children }) {
  return (
    <div>
      <Seo title={`${title} — JerseyLab`} description={description} canonicalPath={path} />

      <CollectionHero
        breadcrumb={<Breadcrumb trail={[{ label: 'מידע משפטי' }, { label: title }]} />}
        title={title}
        description={intro}
      >
        <p className="mt-4 text-sm text-brand-navy/45">
          עודכן לאחרונה: <span dir="ltr">{updated || BUSINESS.lastUpdated}</span>
        </p>
      </CollectionHero>

      <div className="shop-container">
        <div className="mx-auto mt-8 max-w-3xl">
          <article className="shop-card legal-body p-6 sm:p-10">
            {children}
          </article>

          <nav className="mt-10" aria-labelledby="legal-more">
            <h2 id="legal-more" className="text-lg font-semibold text-brand-navy">מסמכים נוספים</h2>
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
    <ul className="list-disc space-y-2 pr-5 marker:text-brand-orange">
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
