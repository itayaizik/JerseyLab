import { getCategoryCards } from "@/api/categoryCards";
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Save, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getPopularClubs } from "@/api/popularClubs";

const DEFAULT_CLUBS = [
  { name: 'ליברפול', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/c/cd/Liverpool_FC.svg/200px-Liverpool_FC.svg.png', href: '/catalog?q=liverpool', sort_order: 0, active: true },
  { name: 'ארסנל', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/5/53/Arsenal_FC.svg/200px-Arsenal_FC.svg.png', href: '/catalog?q=arsenal', sort_order: 1, active: true },
  { name: "מנצ'סטר סיטי", logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/e/eb/Manchester_City_FC_badge.svg/200px-Manchester_City_FC_badge.svg.png', href: '/catalog?q=manchester+city', sort_order: 2, active: true },
  { name: "מנצ'סטר יונייטד", logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/7/7a/Manchester_United_FC_crest.svg/200px-Manchester_United_FC_crest.svg.png', href: '/catalog?q=manchester+united', sort_order: 3, active: true },
  { name: 'ברצלונה', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/4/47/FC_Barcelona_%28crest%29.svg/200px-FC_Barcelona_%28crest%29.svg.png', href: '/catalog?q=barcelona', sort_order: 4, active: true },
  { name: 'ריאל מדריד', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/e/eb/Real_Madrid_CF.svg/200px-Real_Madrid_CF.svg.png', href: '/catalog?q=real+madrid', sort_order: 5, active: true },
  { name: 'יובנטוס', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/b/bc/Juventus_FC_2017_icon_%28black%29.svg/200px-Juventus_FC_2017_icon_%28black%29.svg.png', href: '/catalog?q=juventus', sort_order: 6, active: true },
  { name: "פריז סן-ז'רמן", logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/a/a7/Paris_Saint-Germain_F.C..svg/200px-Paris_Saint-Germain_F.C..svg.png', href: '/catalog?q=psg', sort_order: 7, active: true },
  { name: 'בייארן', logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg/200px-FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg.png', href: '/catalog?q=bayern', sort_order: 8, active: true },
  { name: "צ'לסי", logo_url: 'https://upload.wikimedia.org/wikipedia/he/thumb/c/cc/Chelsea_FC.svg/200px-Chelsea_FC.svg.png', href: '/catalog?q=chelsea', sort_order: 9, active: true },
];

const DEFAULT_CATS = [
  { label: 'ילדים', subtitle: 'כל הגלים ובחורות', href: '/catalog?gender=kids', image_url: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&q=80', sort_order: 0, active: true },
  { label: 'רטרו', subtitle: 'קלאסיקות נצחיות', href: '/catalog?tag=retro', image_url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&q=80', sort_order: 1, active: true },
  { label: 'ליגות', subtitle: 'אנגליה • ספרד • עוד', href: '/catalog', image_url: 'https://images.unsplash.com/photo-1551958219-acbc630e2914?w=400&q=80', sort_order: 2, active: true },
  { label: 'נבחרות', subtitle: 'מונדיאל 2026', href: '/catalog?type=national', image_url: 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=400&q=80', sort_order: 3, active: true },
  { label: 'שחקנים', subtitle: 'חולצות עם שם', href: '/catalog?type=player', image_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&q=80', sort_order: 4, active: true },
  { label: 'NBA 🏀', subtitle: 'באסקטבול', href: '/catalog?sport=basketball', image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80', sort_order: 5, active: true },
  { label: 'סייל ⚡', subtitle: 'מחירים מטורפים', href: '/catalog?sale=true', image_url: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=400&q=80', sort_order: 6, active: true },
];

const DEFAULT_LEAGUES = [
  { name: 'ליגת העל', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9d/Ligat_ha%27Al_logo.svg/200px-Ligat_ha%27Al_logo.svg.png', href: "/catalog?league=Ligat Ha'al", sort_order: 0, active: true },
  { name: 'פרמייר ליג', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/200px-Premier_League_Logo.svg.png', href: '/catalog?league=Premier League', sort_order: 1, active: true },
  { name: 'לה ליגה', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/LaLiga_logo_2023.svg/200px-LaLiga_logo_2023.svg.png', href: '/catalog?league=La Liga', sort_order: 2, active: true },
  { name: 'סרייה א', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Serie_A_logo_2022.svg/200px-Serie_A_logo_2022.svg.png', href: '/catalog?league=Serie A', sort_order: 3, active: true },
  { name: 'בונדסליגה', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/df/Bundesliga_logo_%282017%29.svg/200px-Bundesliga_logo_%282017%29.svg.png', href: '/catalog?league=Bundesliga', sort_order: 4, active: true },
  { name: 'ליגה צרפתית', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/03/Ligue_1_logo%282020%29.svg/200px-Ligue_1_logo%282020%29.svg.png', href: '/catalog?league=Ligue 1', sort_order: 5, active: true },
  { name: 'ליגת האלופות', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/UEFA_Champions_League.svg/200px-UEFA_Champions_League.svg.png', href: '/catalog?league=Champions League', sort_order: 6, active: true },
  { name: 'מונדיאל', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9a/FIFA_World_Cup.svg/200px-FIFA_World_Cup.svg.png', href: '/catalog?league=World Cup', sort_order: 7, active: true },
  { name: 'נבחרות', logo_url: '', href: '/catalog?type=national', sort_order: 8, active: true },
  { name: 'רטרו', logo_url: '', href: '/catalog?tag=retro', sort_order: 9, active: true },
];

function ClubRow({ club, onChange, onDelete, onMoveUp, onMoveDown, canUp, canDown }) {
  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-3">
      <div className="flex flex-col flex-shrink-0">
        <GripVertical className="w-4 h-4 text-varnish mx-auto" />
        <div className="flex gap-0.5 mt-1">
          <button onClick={onMoveUp} disabled={!canUp} className="text-varnish hover:text-turf disabled:opacity-20 disabled:cursor-not-allowed"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button onClick={onMoveDown} disabled={!canDown} className="text-varnish hover:text-turf disabled:opacity-20 disabled:cursor-not-allowed"><ChevronDown className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {club.logo_url && <img src={club.logo_url} alt="" className="w-8 h-8 object-contain flex-shrink-0" onError={e => e.target.style.display='none'} />}
      <input
        value={club.name}
        onChange={e => onChange({ ...club, name: e.target.value })}
        placeholder="שם קבוצה"
        className="flex-1 bg-pitch border border-white/20 px-2 py-1.5 text-xs text-chalk focus:outline-none focus:border-turf"
      />
      <input
        value={club.logo_url || ''}
        onChange={e => onChange({ ...club, logo_url: e.target.value })}
        placeholder="URL לוגו"
        dir="ltr"
        className="flex-1 bg-pitch border border-white/20 px-2 py-1.5 text-xs text-chalk focus:outline-none focus:border-turf"
      />
      <input
        value={club.href || ''}
        onChange={e => onChange({ ...club, href: e.target.value })}
        placeholder="/catalog?q=..."
        dir="ltr"
        className="w-36 bg-pitch border border-white/20 px-2 py-1.5 text-xs text-chalk focus:outline-none focus:border-turf"
      />
      <label className="flex items-center gap-1 text-xs text-varnish flex-shrink-0">
        <input type="checkbox" checked={club.active !== false} onChange={e => onChange({ ...club, active: e.target.checked })} />
        פעיל
      </label>
      <button onClick={onDelete} className="text-redcard hover:opacity-70 flex-shrink-0">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function LeagueRow({ league, onChange, onDelete, onMoveUp, onMoveDown, canUp, canDown }) {
  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-3">
      <div className="flex flex-col flex-shrink-0">
        <GripVertical className="w-4 h-4 text-varnish mx-auto" />
        <div className="flex gap-0.5 mt-1">
          <button onClick={onMoveUp} disabled={!canUp} className="text-varnish hover:text-turf disabled:opacity-20 disabled:cursor-not-allowed"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button onClick={onMoveDown} disabled={!canDown} className="text-varnish hover:text-turf disabled:opacity-20 disabled:cursor-not-allowed"><ChevronDown className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {league.logo_url && <img src={league.logo_url} alt="" className="w-8 h-8 object-contain flex-shrink-0" onError={e => e.target.style.display='none'} />}
      <input
        value={league.name}
        onChange={e => onChange({ ...league, name: e.target.value })}
        placeholder="שם ליגה"
        className="flex-1 bg-pitch border border-white/20 px-2 py-1.5 text-xs text-chalk focus:outline-none focus:border-turf"
      />
      <input
        value={league.logo_url || ''}
        onChange={e => onChange({ ...league, logo_url: e.target.value })}
        placeholder="URL לוגו (אופציונלי)"
        dir="ltr"
        className="flex-1 bg-pitch border border-white/20 px-2 py-1.5 text-xs text-chalk focus:outline-none focus:border-turf"
      />
      <input
        value={league.href || ''}
        onChange={e => onChange({ ...league, href: e.target.value })}
        placeholder="/catalog?league=..."
        dir="ltr"
        className="w-40 bg-pitch border border-white/20 px-2 py-1.5 text-xs text-chalk focus:outline-none focus:border-turf"
      />
      <label className="flex items-center gap-1 text-xs text-varnish flex-shrink-0">
        <input type="checkbox" checked={league.active !== false} onChange={e => onChange({ ...league, active: e.target.checked })} />
        פעיל
      </label>
      <button onClick={onDelete} className="text-redcard hover:opacity-70 flex-shrink-0">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function CatRow({ cat, onChange, onDelete, onMoveUp, onMoveDown, canUp, canDown }) {
  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-3">
      <div className="flex flex-col flex-shrink-0">
        <GripVertical className="w-4 h-4 text-varnish mx-auto" />
        <div className="flex gap-0.5 mt-1">
          <button onClick={onMoveUp} disabled={!canUp} className="text-varnish hover:text-turf disabled:opacity-20 disabled:cursor-not-allowed"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button onClick={onMoveDown} disabled={!canDown} className="text-varnish hover:text-turf disabled:opacity-20 disabled:cursor-not-allowed"><ChevronDown className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {cat.image_url && <img src={cat.image_url} alt="" className="w-10 h-10 object-cover flex-shrink-0 border border-white/20" />}
      <input
        value={cat.label}
        onChange={e => onChange({ ...cat, label: e.target.value })}
        placeholder="תווית"
        className="w-28 bg-pitch border border-white/20 px-2 py-1.5 text-xs text-chalk focus:outline-none focus:border-turf"
      />
      <input
        value={cat.subtitle || ''}
        onChange={e => onChange({ ...cat, subtitle: e.target.value })}
        placeholder="תת כותרת"
        className="w-36 bg-pitch border border-white/20 px-2 py-1.5 text-xs text-chalk focus:outline-none focus:border-turf"
      />
      <input
        value={cat.image_url || ''}
        onChange={e => onChange({ ...cat, image_url: e.target.value })}
        placeholder="URL תמונה"
        dir="ltr"
        className="flex-1 bg-pitch border border-white/20 px-2 py-1.5 text-xs text-chalk focus:outline-none focus:border-turf"
      />
      <input
        value={cat.href || ''}
        onChange={e => onChange({ ...cat, href: e.target.value })}
        placeholder="/catalog?..."
        dir="ltr"
        className="w-36 bg-pitch border border-white/20 px-2 py-1.5 text-xs text-chalk focus:outline-none focus:border-turf"
      />
      <label className="flex items-center gap-1 text-xs text-varnish flex-shrink-0">
        <input type="checkbox" checked={cat.active !== false} onChange={e => onChange({ ...cat, active: e.target.checked })} />
        פעיל
      </label>
      <button onClick={onDelete} className="text-redcard hover:opacity-70 flex-shrink-0">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ManageHomeSections() {
  const [clubs, setClubs] = useState([]);
  const [cats, setCats] = useState([]);
  const [clubRecords, setClubRecords] = useState([]);
  const [catRecords, setCatRecords] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [leagueRecords, setLeagueRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const [clubsData, catsData, leaguesData] = await Promise.all([
  getPopularClubs(),
  getCategoryCards(),
  base44.entities.LeagueCard.list('sort_order', 100),
]);
      setClubRecords(clubsData);
      setCats(catsData);
      setCatRecords(catsData);
      setLeagueRecords(leaguesData);
      setLeagues(leaguesData.length > 0 ? leaguesData : DEFAULT_LEAGUES.map((l, i) => ({ ...l, _local: true, _id: i })));

      // If no clubs in DB yet, seed with defaults
      if (clubsData.length === 0) {
        setClubs(DEFAULT_CLUBS.map((c, i) => ({ ...c, _local: true, _id: i })));
      } else {
        setClubs(clubsData);
      }

      if (catsData.length === 0) {
        setCats(DEFAULT_CATS.map((c, i) => ({ ...c, _local: true, _id: i })));
      } else {
        setCats(catsData);
      }

      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);

    // Save clubs: delete all existing, bulk create fresh
    await Promise.all(clubRecords.map(r => base44.entities.PopularClub.delete(r.id)));
    const newClubs = await base44.entities.PopularClub.bulkCreate(
      clubs.map((c, i) => ({ name: c.name, logo_url: c.logo_url || '', href: c.href || '', sort_order: i, active: c.active !== false }))
    );
    setClubRecords(newClubs || []);
    setClubs(newClubs || clubs);

    // Save cats: delete all existing, bulk create fresh
    await Promise.all(catRecords.map(r => base44.entities.CategoryCard.delete(r.id)));
    const newCats = await base44.entities.CategoryCard.bulkCreate(
      cats.map((c, i) => ({ label: c.label, subtitle: c.subtitle || '', image_url: c.image_url || '', href: c.href || '', sort_order: i, active: c.active !== false }))
    );
    setCatRecords(newCats || []);
    setCats(newCats || cats);

    // Save leagues: delete all existing, bulk create fresh
    await Promise.all(leagueRecords.map(r => base44.entities.LeagueCard.delete(r.id)));
    const newLeagues = await base44.entities.LeagueCard.bulkCreate(
      leagues.map((l, i) => ({ name: l.name, logo_url: l.logo_url || '', href: l.href || '', sort_order: i, active: l.active !== false }))
    );
    setLeagueRecords(newLeagues || []);
    setLeagues(newLeagues || leagues);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addClub = () => setClubs(p => [...p, { name: '', logo_url: '', href: '', active: true, sort_order: p.length, _local: true, _id: Date.now() }]);
  const addCat = () => setCats(p => [...p, { label: '', subtitle: '', image_url: '', href: '', active: true, sort_order: p.length, _local: true, _id: Date.now() }]);
  const addLeague = () => setLeagues(p => [...p, { name: '', logo_url: '', href: '', active: true, sort_order: p.length, _local: true, _id: Date.now() }]);

  const move = (setter) => (i, dir) => setter(p => {
    const j = i + dir;
    if (j < 0 || j >= p.length) return p;
    const arr = [...p];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return arr;
  });
  const moveClub = move(setClubs);
  const moveCat = move(setCats);
  const moveLeague = move(setLeagues);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-black text-2xl text-turf">עריכת סקשנים בדף הבית</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-turf text-pitch px-5 py-2.5 font-heading font-bold text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'שומר...' : saved ? '✓ נשמר!' : 'שמור הכל'}
        </button>
      </div>

      {/* Popular Clubs */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-lg text-chalk">⚽ קבוצות פופולריות</h2>
          <button onClick={addClub} className="flex items-center gap-1 text-xs text-turf border border-turf/40 hover:border-turf px-3 py-1.5">
            <Plus className="w-3 h-3" /> הוסף קבוצה
          </button>
        </div>
        <p className="text-xs text-varnish mb-3">שם • URL לוגו • קישור • פעיל/כבוי</p>
        <div className="space-y-2">
          {clubs.map((club, i) => (
            <ClubRow
              key={club.id || club._id}
              club={club}
              onChange={updated => setClubs(p => p.map((c, idx) => idx === i ? updated : c))}
              onDelete={() => setClubs(p => p.filter((_, idx) => idx !== i))}
              onMoveUp={() => moveClub(i, -1)}
              onMoveDown={() => moveClub(i, 1)}
              canUp={i > 0}
              canDown={i < clubs.length - 1}
            />
          ))}
        </div>
        {clubs.length === 0 && <p className="text-varnish text-sm text-center py-6">אין קבוצות - לחץ הוסף</p>}
      </section>

      {/* Category Cards */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-lg text-chalk">🗂️ כרטיסי קטגוריות</h2>
          <button onClick={addCat} className="flex items-center gap-1 text-xs text-turf border border-turf/40 hover:border-turf px-3 py-1.5">
            <Plus className="w-3 h-3" /> הוסף קטגוריה
          </button>
        </div>
        <p className="text-xs text-varnish mb-3">תווית • תת כותרת • URL תמונה • קישור • פעיל/כבוי</p>
        <div className="space-y-2">
          {cats.map((cat, i) => (
            <CatRow
              key={cat.id || cat._id}
              cat={cat}
              onChange={updated => setCats(p => p.map((c, idx) => idx === i ? updated : c))}
              onDelete={() => setCats(p => p.filter((_, idx) => idx !== i))}
              onMoveUp={() => moveCat(i, -1)}
              onMoveDown={() => moveCat(i, 1)}
              canUp={i > 0}
              canDown={i < cats.length - 1}
            />
          ))}
        </div>
        {cats.length === 0 && <p className="text-varnish text-sm text-center py-6">אין קטגוריות - לחץ הוסף</p>}
      </section>

      {/* Leagues & Tournaments */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-lg text-chalk">🏆 ליגות וטורנירים</h2>
          <button onClick={addLeague} className="flex items-center gap-1 text-xs text-turf border border-turf/40 hover:border-turf px-3 py-1.5">
            <Plus className="w-3 h-3" /> הוסף ליגה
          </button>
        </div>
        <p className="text-xs text-varnish mb-3">שם • URL לוגו (אופציונלי - בלי לוגו יוצג אייקון גביע) • קישור • פעיל/כבוי</p>
        <div className="space-y-2">
          {leagues.map((league, i) => (
            <LeagueRow
              key={league.id || league._id}
              league={league}
              onChange={updated => setLeagues(p => p.map((l, idx) => idx === i ? updated : l))}
              onDelete={() => setLeagues(p => p.filter((_, idx) => idx !== i))}
              onMoveUp={() => moveLeague(i, -1)}
              onMoveDown={() => moveLeague(i, 1)}
              canUp={i > 0}
              canDown={i < leagues.length - 1}
            />
          ))}
        </div>
        {leagues.length === 0 && <p className="text-varnish text-sm text-center py-6">אין ליגות - לחץ הוסף</p>}
      </section>
    </div>
  );
}