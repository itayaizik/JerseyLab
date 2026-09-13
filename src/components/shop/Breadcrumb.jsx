import React from 'react';
import { Link } from 'react-router-dom';

// "דף הבית / קטלוג / ..." above a page title. The home page is always first,
// and the last entry is the page itself, so it is never a link.
export default function Breadcrumb({ trail = [] }) {
  const items = [{ label: 'דף הבית', to: '/' }, ...trail];
  return (
    <nav aria-label="נתיב ניווט" className="shop-eyebrow mb-3">
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
