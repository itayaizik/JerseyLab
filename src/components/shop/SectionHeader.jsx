import React from 'react';

// The heading over a section of the home page: large, bold and centred, with an
// optional line under it.
export default function SectionHeader({ id, title, subtitle, className = '' }) {
  return (
    <div className={`mx-auto max-w-3xl text-center ${className}`}>
      <h2 id={id} className="shop-title">{title}</h2>
      {subtitle && <p className="mt-3 text-base leading-relaxed text-brand-navy/60 sm:text-lg">{subtitle}</p>}
    </div>
  );
}
