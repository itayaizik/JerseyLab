import React from 'react';
import { Link } from 'react-router-dom';
import { t } from '@/lib/i18n';

// "דף הבית / קטלוג / ..." above a page title. The home page is always first,
// and the last entry is the page itself, so it is never a link.
export default function Breadcrumb({ trail = [] }) {
  const items = [{ label: t('דף הבית', 'Home'), to: '/' }, ...trail];
  return (
    <nav aria-label={t('נתיב ניווט', 'Breadcrumb')} className="shop-eyebrow mb-3">
      {items.map((item, i) => (
        <React.Fragment key={`${item.label}-${i}`}>
          {i > 0 && <span className="mx-2" aria-hidden="true">/</span>}
          {item.to && i < items.length - 1
            ? <Link to={item.to} className="transition hover:text-brand-navy">{item.label}</Link>
            : <span className="text-brand-navy/70">{item.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}
