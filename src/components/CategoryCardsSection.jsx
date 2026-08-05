import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DEFAULT_CATS = [
  { label: 'ילדים', subtitle: 'כל הגלים ובחורות', href: '/catalog?gender=kids', image_url: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&q=80' },
  { label: 'רטרו', subtitle: 'קלאסיקות נצחיות', href: '/catalog?tag=retro', image_url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&q=80' },
  { label: 'ליגות', subtitle: 'אנגליה • ספרד • עוד', href: '/catalog', image_url: 'https://images.unsplash.com/photo-1551958219-acbc630e2914?w=400&q=80' },
  { label: 'נבחרות', subtitle: 'מונדיאל 2026', href: '/catalog?type=national', image_url: 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=400&q=80' },
  { label: 'שחקנים', subtitle: 'חולצות עם שם', href: '/catalog?type=player', image_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&q=80' },
  { label: 'NBA 🏀', subtitle: 'באסקטבול', href: '/catalog?sport=basketball', image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80' },
  { label: 'סייל ⚡', subtitle: 'מחירים מטורפים', href: '/catalog?sale=true', image_url: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=400&q=80' },
];

export default function CategoryCardsSection({ title }) {
  const scrollRef = useRef(null);
  const [cats, setCats] = useState([]);

  useEffect(() => {
    base44.entities.CategoryCard.filter({ active: true }, 'sort_order', 100)
      .then(data => setCats(data.length > 0 ? data : DEFAULT_CATS))
      .catch(() => setCats(DEFAULT_CATS));
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 10) {
        container.scrollLeft = 0;
      }
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scroll = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -dir * 220, behavior: 'smooth' });
  };

  const displayCats = cats.length > 0 ? cats : DEFAULT_CATS;
  const loopedCats = [...displayCats, ...displayCats];

  return (
    <section className="py-10" style={{ background: '#E8DFC8' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <Link to="/catalog" className="text-xs font-heading font-bold text-[#E8622A] uppercase tracking-wide border-b border-[#E8622A] hover:opacity-70">
            ← כל המוצרים
          </Link>
          <h2 className="font-heading font-bold text-xl text-[#1B2A4A] uppercase tracking-wide">
            {title || 'קנה לפי קטגוריה'}
          </h2>
        </div>

        <div className="relative flex items-center gap-2">
          <button
            onClick={() => scroll(-1)}
            aria-label="גלול ימינה"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center border-2 border-[#1B2A4A] bg-white hover:bg-[#F2ECD9] transition-colors"
            style={{ boxShadow: '2px 2px 0 #1B2A4A' }}
          >
            <ChevronRight className="w-4 h-4 text-[#1B2A4A]" />
          </button>

          <div ref={scrollRef} className="flex gap-3 overflow-x-auto scroll-smooth pb-1 flex-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {loopedCats.map((cat, i) => (
              <Link
                key={`${cat.id || cat.label}-${i}`}
                to={cat.href || '#'}
                className="flex-shrink-0 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
                style={{ width: 160, height: 220, border: '2px solid #1B2A4A', boxShadow: '3px 3px 0 #1B2A4A' }}
              >
                {cat.image_url && (
                  <img
                    src={cat.image_url}
                    alt={cat.label}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A]/90 via-[#1B2A4A]/30 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-3 text-right">
                  <p className="font-heading font-black text-white text-base leading-tight">{cat.label}</p>
                  {cat.subtitle && <p className="font-body text-white/70 text-xs mt-0.5">{cat.subtitle}</p>}
                </div>
              </Link>
            ))}
          </div>

          <button
            onClick={() => scroll(1)}
            aria-label="גלול שמאלה"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center border-2 border-[#1B2A4A] bg-white hover:bg-[#F2ECD9] transition-colors"
            style={{ boxShadow: '2px 2px 0 #1B2A4A' }}
          >
            <ChevronLeft className="w-4 h-4 text-[#1B2A4A]" />
          </button>
        </div>
      </div>
    </section>
  );
}