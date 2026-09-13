import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionHeader from '@/components/shop/SectionHeader';
import ScrollRow from '@/components/shop/ScrollRow';

const DEFAULT_CLUBS = [
  { name: 'ליברפול', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/c/cd/Liverpool_FC.svg/200px-Liverpool_FC.svg.png', href: `/catalog?q=${encodeURIComponent('ליברפול')}` },
  { name: 'ארסנל', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/5/53/Arsenal_FC.svg/200px-Arsenal_FC.svg.png', href: `/catalog?q=${encodeURIComponent('ארסנל')}` },
  { name: "מנצ'סטר סיטי", logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/e/eb/Manchester_City_FC_badge.svg/200px-Manchester_City_FC_badge.svg.png', href: `/catalog?q=${encodeURIComponent('מנצסטר סיטי')}` },
  { name: "מנצ'סטר יונייטד", logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/7/7a/Manchester_United_FC_crest.svg/200px-Manchester_United_FC_crest.svg.png', href: `/catalog?q=${encodeURIComponent('מנצסטר יונייטד')}` },
  { name: 'ברצלונה', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/4/47/FC_Barcelona_%28crest%29.svg/200px-FC_Barcelona_%28crest%29.svg.png', href: `/catalog?q=${encodeURIComponent('ברצלונה')}` },
  { name: 'ריאל מדריד', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/e/eb/Real_Madrid_CF.svg/200px-Real_Madrid_CF.svg.png', href: `/catalog?q=${encodeURIComponent('ריאל מדריד')}` },
  { name: 'יובנטוס', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/b/bc/Juventus_FC_2017_icon_%28black%29.svg/200px-Juventus_FC_2017_icon_%28black%29.svg.png', href: `/catalog?q=${encodeURIComponent('יובנטוס')}` },
  { name: "פריז סן-ז'רמן", logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/a/a7/Paris_Saint-Germain_F.C..svg/200px-Paris_Saint-Germain_F.C..svg.png', href: `/catalog?q=${encodeURIComponent('פריז סן זרמן')}` },
  { name: 'בייארן', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg/200px-FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg.png', href: `/catalog?q=${encodeURIComponent('באיירן מינכן')}` },
  { name: "צ'לסי", logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/c/cc/Chelsea_FC.svg/200px-Chelsea_FC.svg.png', href: `/catalog?q=${encodeURIComponent('צלסי')}` },
];

// The clubs row on the home page, managed from ניהול > סקשנים בדף הבית.
export default function PopularClubsSection({ title }) {
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    base44.entities.PopularClub.filter({ active: true }, 'sort_order', 100)
      .then(data => setClubs(data.length > 0 ? data : DEFAULT_CLUBS))
      .catch(() => setClubs(DEFAULT_CLUBS));
  }, []);

  if (!clubs.length) return null;

  return (
    <section className="mt-16 sm:mt-24" aria-labelledby="clubs-heading">
      <div className="shop-container">
        <SectionHeader id="clubs-heading" title={title || 'קנו לפי קבוצה'} />
        <div className="mt-10">
          <ScrollRow label="קבוצות" itemClassName="w-[44%] sm:w-[30%] md:w-[23%] lg:w-[18%] xl:w-[15.2%]">
            {clubs.map(club => (
              <Link
                key={club.id || club.name}
                to={club.href || `/catalog?q=${encodeURIComponent(club.name)}`}
                className="group flex h-full flex-col rounded-3xl bg-white p-2.5 shadow-card transition-shadow hover:shadow-lift sm:p-3"
              >
                <span className="flex aspect-square items-center justify-center rounded-[1.125rem] bg-brand-mist">
                  {club.logo_url && (
                    <img
                      src={club.logo_url}
                      alt=""
                      loading="lazy"
                      className="h-1/2 w-1/2 object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-110"
                      onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
                    />
                  )}
                </span>
                <span className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-3.5">
                  <span className="min-w-0 truncate text-[15px] font-semibold text-brand-navy">{club.name}</span>
                  <span aria-hidden="true" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-brand-orange to-brand-orange-dark text-white transition-transform duration-200 group-hover:-translate-x-0.5">
                    <ArrowLeft className="h-4 w-4" />
                  </span>
                </span>
              </Link>
            ))}
          </ScrollRow>
        </div>
      </div>
    </section>
  );
}
