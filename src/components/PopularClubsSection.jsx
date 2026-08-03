import { getPopularClubs } from "@/api/popularClubs";
import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DEFAULT_CLUBS = [
  { name: 'ליברפול', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/c/cd/Liverpool_FC.svg/200px-Liverpool_FC.svg.png', href: '/catalog?club=Liverpool' },
  { name: 'ארסנל', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/5/53/Arsenal_FC.svg/200px-Arsenal_FC.svg.png', href: '/catalog?club=Arsenal' },
  { name: "מנצ'סטר סיטי", logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/e/eb/Manchester_City_FC_badge.svg/200px-Manchester_City_FC_badge.svg.png', href: '/catalog?club=Manchester+City' },
  { name: "מנצ'סטר יונייטד", logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/7/7a/Manchester_United_FC_crest.svg/200px-Manchester_United_FC_crest.svg.png', href: '/catalog?club=Manchester+United' },
  { name: 'ברצלונה', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/4/47/FC_Barcelona_%28crest%29.svg/200px-FC_Barcelona_%28crest%29.svg.png', href: '/catalog?club=Barcelona' },
  { name: 'ריאל מדריד', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/e/eb/Real_Madrid_CF.svg/200px-Real_Madrid_CF.svg.png', href: '/catalog?club=Real+Madrid' },
  { name: 'יובנטוס', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/b/bc/Juventus_FC_2017_icon_%28black%29.svg/200px-Juventus_FC_2017_icon_%28black%29.svg.png', href: '/catalog?club=Juventus' },
  { name: "פריז סן-ז'רמן", logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/a/a7/Paris_Saint-Germain_F.C..svg/200px-Paris_Saint-Germain_F.C..svg.png', href: '/catalog?club=Paris+Saint-Germain' },
  { name: 'בייארן', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg/200px-FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg.png', href: '/catalog?club=Bayern+Munich' },
  { name: "צ'לסי", logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/c/cc/Chelsea_FC.svg/200px-Chelsea_FC.svg.png', href: '/catalog?club=Chelsea' },
];

export default function PopularClubsSection({ title }) {
  const scrollRef = useRef(null);
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
  base44.entities.PopularClub.filter({ active: true }, 'sort_order', 100)
    .then(data => setClubs(data.length > 0 ? data : DEFAULT_CLUBS))
    .catch(() => setClubs(DEFAULT_CLUBS));
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
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -dir * 200, behavior: 'smooth' });
  };

  const displayClubs = clubs.length > 0 ? clubs : DEFAULT_CLUBS;
  const loopedClubs = [...displayClubs, ...displayClubs];

  return (
    <section className="py-10" style={{ background: '#F2ECD9' }}>
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-heading font-bold text-xl text-[#1B2A4A] uppercase tracking-wide mb-6 text-center border-b-2 border-[#E8622A] pb-1 inline-block w-full">
          {title || 'קבוצות פופולריות'}
        </h2>

        <div className="relative flex items-center gap-2">
          <button
            onClick={() => scroll(-1)}
            aria-label="גלול ימינה"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center border-2 border-[#1B2A4A] bg-white hover:bg-[#F2ECD9] transition-colors"
            style={{ boxShadow: '2px 2px 0 #1B2A4A' }}
          >
            <ChevronRight className="w-4 h-4 text-[#1B2A4A]" />
          </button>

          <div ref={scrollRef} className="flex gap-3 overflow-x-auto scroll-smooth pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {loopedClubs.map((club, i) => (
              <Link
                key={club.id || i}
                to={club.href || club.logo_url || '#'}
                className="flex-shrink-0 flex flex-col items-center gap-2 bg-white border-2 border-[#1B2A4A] p-4 hover:border-[#E8622A] hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
                style={{ width: 110, boxShadow: '2px 2px 0 #1B2A4A' }}
              >
                {(club.logo_url) && (
                  <img
                    src={club.logo_url}
                    alt={club.name}
                    loading="lazy"
                    className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <span className="text-xs font-heading font-bold text-[#1B2A4A] text-center leading-tight">{club.name}</span>
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