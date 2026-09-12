import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '@/components/Seo';
import { BUSINESS } from '@/lib/business';

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
    <div className="bg-[#F2ECD9] min-h-screen">
      <Seo title={`${title} — JerseyLab`} description={description} canonicalPath={path} />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav className="text-xs font-body text-[#1B2A4A]/50 mb-3" aria-label="נתיב ניווט">
          <Link to="/" className="hover:text-[#E8622A]">דף הבית</Link>
          {' · '}
          <span>מידע משפטי</span>
        </nav>

        <header className="mb-6 pb-5 border-b-2 border-[#1B2A4A]/15">
          <h1 className="font-heading font-black text-3xl md:text-4xl text-[#1B2A4A] uppercase mb-2">{title}</h1>
          {intro && <p className="font-body text-[#1B2A4A]/70 leading-relaxed max-w-2xl">{intro}</p>}
          <p className="font-mono text-xs text-[#1B2A4A]/45 mt-3">
            עודכן לאחרונה: {updated || BUSINESS.lastUpdated}
          </p>
        </header>

        <article className="bg-white border-2 border-[#1B2A4A] p-6 md:p-8 legal-body"
          style={{ boxShadow: '5px 5px 0 #1B2A4A' }}>
          {children}
        </article>

        <nav className="mt-8 pt-6 border-t-2 border-[#1B2A4A]/15" aria-label="מסמכים נוספים">
          <h2 className="font-heading font-bold text-sm text-[#1B2A4A] uppercase tracking-wide mb-3">מסמכים נוספים</h2>
          <div className="flex flex-wrap gap-2">
            {LEGAL_PAGES.filter(p => p.path !== path).map(p => (
              <Link key={p.path} to={p.path}
                className="flex items-center min-h-[44px] px-3 text-xs font-heading font-bold uppercase tracking-wide border-2 border-[#1B2A4A]/30 text-[#1B2A4A] bg-white hover:border-[#1B2A4A] hover:bg-[#F2ECD9] transition-colors">
                {p.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

// Section heading inside a legal document.
export function Section({ title, children }) {
  return (
    <section className="mt-7 first:mt-0">
      <h2 className="font-heading font-bold text-lg text-[#1B2A4A] mb-2.5">{title}</h2>
      <div className="space-y-3 font-body text-[15px] text-[#1B2A4A]/80 leading-relaxed">{children}</div>
    </section>
  );
}

export function Bullets({ items }) {
  return (
    <ul className="space-y-2 pr-5 list-disc marker:text-[#E8622A]">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

// A fact that the owner still has to supply shows as a marked gap rather than
// silently reading as though the business has no address.
export function Fact({ label, value, fallback = 'יעודכן בקרוב' }) {
  const missing = !value || String(value).startsWith('TODO_');
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5 py-1.5 border-b border-[#1B2A4A]/10 last:border-b-0">
      <dt className="font-bold text-[#1B2A4A] min-w-[140px]">{label}</dt>
      <dd className={missing ? 'text-[#E8622A]' : 'text-[#1B2A4A]/80'}>
        {missing ? fallback : value}
      </dd>
    </div>
  );
}
