import React, { useState } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { t, isEn } from '@/lib/i18n';
import { term } from '@/lib/english';

// Stored in Hebrew, whatever the language, so the owner reads one set of
// names; shown in the site's language.
const POPULAR_TEAMS = [
  // ישראל
  'מכבי תל אביב', 'הפועל תל אביב', 'מכבי חיפה', 'הפועל חיפה', 'הפועל באר שבע',
  'בית"ר ירושלים', 'הפועל ירושלים', 'מכבי נתניה', 'מכבי פתח תקווה', 'עירוני קריית שמונה',
  // חו"ל
  'ריאל מדריד', 'ברצלונה', 'אתלטיקו מדריד', 'מנצ\'סטר סיטי', 'מנצ\'סטר יונייטד',
  'ליברפול', 'צ\'לסי', 'ארסנל', 'טוטנהאם', 'ניוקאסל', 'באיירן מינכן', 'בורוסיה דורטמונד',
  'יובנטוס', 'אינטר', 'מילאן', 'נאפולי', 'פריז סן ז\'רמן', 'אייאקס', 'פורטו', 'בנפיקה',
];

// A few teams the shared term list does not carry.
const EXTRA_EN = {
  'הפועל חיפה': 'Hapoel Haifa',
  'הפועל ירושלים': 'Hapoel Jerusalem',
  'מכבי נתניה': 'Maccabi Netanya',
  'מכבי פתח תקווה': 'Maccabi Petah Tikva',
  'עירוני קריית שמונה': 'Ironi Kiryat Shmona',
  'בורוסיה דורטמונד': 'Borussia Dortmund',
};
const teamLabel = (team) => (isEn ? EXTRA_EN[team] || term(team) : team);

export default function TeamPicker({ values = [], onChange }) {
  const [q, setQ] = useState('');
  const query = q.trim();
  const matches = (team) => team.includes(query) || teamLabel(team).toLowerCase().includes(query.toLowerCase());
  const filtered = POPULAR_TEAMS.filter(matches);
  const exact = POPULAR_TEAMS.find((team) => team === query || teamLabel(team).toLowerCase() === query.toLowerCase());

  const toggle = (team) => onChange(values.includes(team) ? values.filter((x) => x !== team) : [...values, team]);
  const addCustom = () => {
    if (query && !values.includes(query)) onChange([...values, query]);
    setQ('');
  };
  const handleEnter = () => {
    if (!query) return;
    if (exact) {
      toggle(exact);
      setQ('');
    } else {
      addCustom();
    }
  };

  return (
    <div>
      {values.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {values.map((team) => (
            <span key={team} className="inline-flex items-center gap-1.5 rounded-full bg-brand-navy py-1.5 pe-2 ps-3 text-[13px] text-white">
              {teamLabel(team)}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== team))}
                className="flex h-5 w-5 items-center justify-center rounded-full opacity-70 transition hover:bg-white/15 hover:opacity-100" aria-label={t(`הסרת ${team}`, `Remove ${teamLabel(team)}`)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-navy/40" aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEnter(); } }}
          placeholder={t('חיפוש קבוצה…', 'Search for a team…')}
          aria-label={t('חיפוש קבוצה', 'Search for a team')}
          className="shop-field ps-11"
        />
      </div>

      <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto">
        {filtered.map((team) => {
          const selected = values.includes(team);
          return (
            <button key={team} type="button" onClick={() => toggle(team)} aria-pressed={selected}
              className={`shop-chip min-h-[2.5rem] px-3.5 ${selected ? 'shop-chip-active' : ''}`}>
              {teamLabel(team)}
            </button>
          );
        })}
        {query && !exact && (
          <button type="button" onClick={addCustom}
            className="inline-flex min-h-[2.5rem] items-center gap-1 rounded-full border border-dashed border-brand-orange px-3.5 text-sm font-medium text-brand-orange-ink transition hover:bg-brand-orange-soft">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> {query}
          </button>
        )}
      </div>
    </div>
  );
}
