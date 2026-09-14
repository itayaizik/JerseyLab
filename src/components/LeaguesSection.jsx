import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionHeader from '@/components/shop/SectionHeader';

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

function LeagueLogo({ src }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <Trophy className="h-9 w-9 text-brand-orange-ink" aria-hidden="true" />;
  return (
    <img src={src} alt="" loading="lazy" onError={() => setFailed(true)}
      className="max-h-16 max-w-[4rem] object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-110" />
  );
}

// Leagues and tournaments as tiles, managed from ניהול > סקשנים בדף הבית.
export default function LeaguesSection({ title }) {
  const [leagues, setLeagues] = useState([]);

  useEffect(() => {
    base44.entities.LeagueCard.filter({ active: true }, 'sort_order', 100)
      .then(data => setLeagues(data.length > 0 ? data : DEFAULT_LEAGUES))
      .catch(() => setLeagues(DEFAULT_LEAGUES));
  }, []);

  if (!leagues.length) return null;

  return (
    <section className="shop-container mt-16 sm:mt-24" aria-labelledby="leagues-heading">
      <SectionHeader id="leagues-heading" title={title || 'ליגות וטורנירים'} />
      {/* A row that scrolls sideways on a phone - ten tiles two to a row were
          more than a screen of scrolling - and a grid from a tablet up. */}
      <ul className="scrollbar-hide -mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-0 sm:mt-10 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5">
        {leagues.map(league => (
          <li key={league.id || league.name} className="w-[8.5rem] flex-shrink-0 snap-start sm:w-auto">
            <Link
              to={league.href || `/catalog?q=${encodeURIComponent(league.name)}`}
              className="group flex h-full flex-col items-center gap-3 rounded-3xl bg-brand-mist px-3 py-5 text-center transition hover:bg-brand-mist-dark sm:gap-4 sm:px-4 sm:py-7"
            >
              <span className="flex h-16 w-16 items-center justify-center">
                <LeagueLogo src={league.logo_url} />
              </span>
              <span className="text-base font-semibold text-brand-navy">{league.name}</span>
              <span className="mt-auto inline-flex min-h-[2.25rem] items-center rounded-full border border-brand-navy/15 bg-white px-4 text-[13px] font-medium text-brand-navy/75 transition group-hover:border-brand-orange group-hover:text-brand-orange-ink">
                לחולצות
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
