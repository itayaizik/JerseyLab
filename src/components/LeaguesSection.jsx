import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DEFAULT_LEAGUES = [
  { name: 'ליגת העל', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9d/Ligat_ha%27Al_logo.svg/200px-Ligat_ha%27Al_logo.svg.png', href: `/catalog?q=${encodeURIComponent('ליגת העל')}` },
  { name: 'פרמייר ליג', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/200px-Premier_League_Logo.svg.png', href: `/catalog?q=${encodeURIComponent('פרמייר ליג')}` },
  { name: 'לה ליגה', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/LaLiga_logo_2023.svg/200px-LaLiga_logo_2023.svg.png', href: `/catalog?q=${encodeURIComponent('לה ליגה')}` },
  { name: 'סרייה א', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Serie_A_logo_2022.svg/200px-Serie_A_logo_2022.svg.png', href: `/catalog?q=${encodeURIComponent('סרייה א')}` },
  { name: 'בונדסליגה', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/df/Bundesliga_logo_%282017%29.svg/200px-Bundesliga_logo_%282017%29.svg.png', href: `/catalog?q=${encodeURIComponent('בונדסליגה')}` },
  { name: 'ליגה צרפתית', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/03/Ligue_1_logo%282020%29.svg/200px-Ligue_1_logo%282020%29.svg.png', href: `/catalog?q=${encodeURIComponent('ליגה צרפתית')}` },
  { name: 'ליגת האלופות', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/UEFA_Champions_League.svg/200px-UEFA_Champions_League.svg.png', href: `/catalog?q=${encodeURIComponent('ליגת האלופות')}` },
  { name: 'מונדיאל', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9a/FIFA_World_Cup.svg/200px-FIFA_World_Cup.svg.png', href: `/catalog?q=${encodeURIComponent('מונדיאל')}` },
  { name: 'נבחרות', logo_url: '', href: '/catalog?type=national' },
  { name: 'רטרו', logo_url: '', href: '/catalog?tag=retro' },
];

export default function LeaguesSection({ title }) {
  const scrollRef = useRef(null);
  const [leagues, setLeagues] = useState([]);

  useEffect(() => {
    base44.entities.LeagueCard.filter({ active: true }, 'sort_order', 100)
      .then(data => setLeagues(data.length > 0 ? data : DEFAULT_LEAGUES))
      .catch(() => setLeagues(DEFAULT_LEAGUES));
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

  const displayLeagues = leagues.length > 0 ? leagues : DEFAULT_LEAGUES;
  const loopedLeagues = [...displayLeagues, ...displayLeagues];

  return (
    <section className="py-10" style={{ background: '#E8DFC8' }}>
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-heading font-bold text-xl text-[#1B2A4A] uppercase tracking-wide mb-6 text-center border-b-2 border-[#E8622A] pb-1 inline-block w-full">
          {title || 'ליגות וטורנירים'}
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
            {loopedLeagues.map((league, i) => (
              <Link
                key={`${league.id || league.name}-${i}`}
                to={league.href || '#'}
                className="flex-shrink-0 flex flex-col items-center gap-2 bg-white border-2 border-[#1B2A4A] p-4 hover:border-[#E8622A] hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
                style={{ width: 110, boxShadow: '2px 2px 0 #1B2A4A' }}
              >
                {league.logo_url ? (
                  <img
                    src={league.logo_url}
                    alt={league.name}
                    loading="lazy"
                    className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                {!league.logo_url && (
                  <div className="w-12 h-12 flex items-center justify-center bg-[#F2ECD9] rounded-full">
                    <Trophy className="w-6 h-6 text-[#E8622A]" />
                  </div>
                )}
                <span className="text-xs font-heading font-bold text-[#1B2A4A] text-center leading-tight">{league.name}</span>
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