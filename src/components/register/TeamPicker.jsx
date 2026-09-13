import React, { useState } from 'react';
import { Search, X, Plus } from 'lucide-react';

const POPULAR_TEAMS = [
  // ישראל
  'מכבי תל אביב', 'הפועל תל אביב', 'מכבי חיפה', 'הפועל חיפה', 'הפועל באר שבע',
  'בית"ר ירושלים', 'הפועל ירושלים', 'מכבי נתניה', 'מכבי פתח תקווה', 'עירוני קריית שמונה',
  // חו"ל
  'ריאל מדריד', 'ברצלונה', 'אתלטיקו מדריד', 'מנצ\'סטר סיטי', 'מנצ\'סטר יונייטד',
  'ליברפול', 'צ\'לסי', 'ארסנל', 'טוטנהאם', 'ניוקאסל', 'באיירן מינכן', 'בורוסיה דורטמונד',
  'יובנטוס', 'אינטר', 'מילאן', 'נאפולי', 'פריז סן ז\'רמן', 'אייאקס', 'פורטו', 'בנפיקה',
];

export default function TeamPicker({ values = [], onChange }) {
  const [q, setQ] = useState('');
  const query = q.trim();
  const filtered = POPULAR_TEAMS.filter((t) => t.includes(query));
  const exactMatch = POPULAR_TEAMS.some((t) => t === query);

  const toggle = (t) => onChange(values.includes(t) ? values.filter((x) => x !== t) : [...values, t]);
  const addCustom = () => {
    if (query && !values.includes(query)) onChange([...values, query]);
    setQ('');
  };
  const handleEnter = () => {
    if (!query) return;
    if (exactMatch) {
      toggle(query);
      setQ('');
    } else {
      addCustom();
    }
  };

  return (
    <div>
      {values.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {values.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-brand-navy py-1.5 pe-2 ps-3 text-[13px] text-white">
              {t}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== t))}
                className="flex h-5 w-5 items-center justify-center rounded-full opacity-70 transition hover:bg-white/15 hover:opacity-100" aria-label={`הסרת ${t}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-navy/40" aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEnter(); } }}
          placeholder="חיפוש קבוצה…"
          aria-label="חיפוש קבוצה"
          className="shop-field pr-11"
        />
      </div>

      <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto">
        {filtered.map((t) => {
          const selected = values.includes(t);
          return (
            <button key={t} type="button" onClick={() => toggle(t)} aria-pressed={selected}
              className={`shop-chip min-h-[2.5rem] px-3.5 ${selected ? 'shop-chip-active' : ''}`}>
              {t}
            </button>
          );
        })}
        {query && !exactMatch && (
          <button type="button" onClick={addCustom}
            className="inline-flex min-h-[2.5rem] items-center gap-1 rounded-full border border-dashed border-brand-orange px-3.5 text-sm font-medium text-brand-orange-ink transition hover:bg-brand-orange-soft">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> {query}
          </button>
        )}
      </div>
    </div>
  );
}
