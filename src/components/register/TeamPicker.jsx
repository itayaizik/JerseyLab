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
        <div className="flex gap-1.5 flex-wrap mb-3">
          {values.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 bg-[#1B2A4A] text-white text-xs px-2.5 py-1.5 font-body">
              {t}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== t))} className="opacity-70 hover:opacity-100" aria-label="הסר">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative mb-3">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1B2A4A]/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEnter(); } }}
          placeholder="חפש קבוצה…"
          className="w-full border-2 border-[#1B2A4A] pr-9 pl-3 py-2.5 text-sm bg-white focus:outline-none font-body"
        />
      </div>

      <div className="flex gap-1.5 flex-wrap max-h-40 overflow-y-auto">
        {filtered.map((t) => {
          const selected = values.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className={`px-3 py-1.5 border-2 text-xs font-heading font-bold transition-colors ${
                selected
                  ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                  : 'border-[#1B2A4A]/30 text-[#1B2A4A] bg-white hover:border-[#1B2A4A] hover:bg-[#F2ECD9]'
              }`}
            >
              {t}
            </button>
          );
        })}
        {query && !exactMatch && (
          <button
            type="button"
            onClick={addCustom}
            className="px-3 py-1.5 border-2 border-dashed border-[#E8622A] text-[#E8622A] text-xs font-heading font-bold hover:bg-[#E8622A] hover:text-white transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> {query}
          </button>
        )}
      </div>
    </div>
  );
}