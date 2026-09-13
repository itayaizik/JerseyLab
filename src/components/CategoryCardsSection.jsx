import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { withStock } from '@/lib/catalogFacets';
import SectionHeader from '@/components/shop/SectionHeader';

const DEFAULT_CATS = [
  { label: 'ילדים', subtitle: 'מידות ילדים', href: '/catalog?gender=kids', image_url: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&q=80' },
  { label: 'רטרו', subtitle: 'קלאסיקות נצחיות', href: '/catalog?tag=retro', image_url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80' },
  { label: 'ליגות', subtitle: 'אנגליה, ספרד ועוד', href: '/catalog', image_url: 'https://images.unsplash.com/photo-1551958219-acbc630e2914?w=600&q=80' },
  { label: 'נבחרות', subtitle: 'מונדיאל 2026', href: '/catalog?type=national', image_url: 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=600&q=80' },
  { label: 'שחקנים', subtitle: 'חולצות עם שם', href: '/catalog?type=player', image_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80' },
];

// Photo cards for the main categories, managed from ניהול > קטגוריות.
export default function CategoryCardsSection({ title }) {
  const [cats, setCats] = useState([]);

  useEffect(() => {
    base44.entities.CategoryCard.filter({ active: true }, 'sort_order', 100)
      .then(data => setCats(data.length > 0 ? data : DEFAULT_CATS))
      .catch(() => setCats(DEFAULT_CATS));
  }, []);

  // A card pointing at an empty catalogue is worse than one card fewer, and
  // these come from the admin panel as well as the defaults above.
  const displayCats = withStock(cats);
  if (!displayCats.length) return null;

  // As many columns as there are cards, up to five, so three cards fill the
  // row instead of leaving two empty columns beside them. Fewer, wider cards
  // are cut shorter to keep the row from towering.
  const count = displayCats.length;
  const columns = count <= 3 ? 'lg:grid-cols-3' : count === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-5';
  const wide = count <= 3;

  return (
    <section className="shop-container mt-16 sm:mt-24" aria-labelledby="categories-heading">
      <SectionHeader id="categories-heading" title={title || 'קנו לפי קטגוריה'} />
      <ul className={`mt-10 grid grid-cols-2 gap-3 sm:gap-4 ${columns}`}>
        {displayCats.map((cat, i) => {
          // An odd card out at the end of a two-column grid spans the row,
          // wider and shorter, instead of leaving a hole beside it.
          const lonely = displayCats.length % 2 === 1 && i === displayCats.length - 1;
          return (
            <li key={cat.id || cat.label} className={lonely ? 'col-span-2 lg:col-span-1' : ''}>
              <Link
                to={cat.href || '/catalog'}
                className={`group relative block overflow-hidden rounded-3xl bg-brand-navy ${lonely ? 'aspect-[16/9]' : 'aspect-[4/5]'} ${wide ? 'lg:aspect-[4/3]' : 'lg:aspect-[4/5]'}`}
              >
                {cat.image_url && (
                  <img src={cat.image_url} alt="" loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                )}
                <span className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between gap-2 rounded-2xl bg-white/90 px-3.5 py-3 backdrop-blur sm:inset-x-3 sm:bottom-3 sm:px-4">
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-brand-navy">{cat.label}</span>
                    {cat.subtitle && <span className="block truncate text-xs text-brand-navy/55">{cat.subtitle}</span>}
                  </span>
                  <span className="hidden flex-shrink-0 rounded-xl bg-gradient-to-b from-brand-orange to-brand-orange-dark px-3 py-1.5 text-[13px] font-semibold text-white sm:inline-flex">
                    לצפייה
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
