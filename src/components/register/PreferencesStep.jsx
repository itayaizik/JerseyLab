import React from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import TeamPicker from './TeamPicker';
import ChipsInput from './ChipsInput';

const STYLES = [
  { id: 'retro', label: 'רטרו' },
  { id: 'new', label: 'חדשות' },
  { id: 'concept', label: 'קונספט' },
  { id: 'national', label: 'נבחרות' },
];

export default function PreferencesStep({ data, onChange, onFinish, onSkip, onBack, loading, error }) {
  const toggleStyle = (id) => {
    const has = data.shirt_styles.includes(id);
    onChange('shirt_styles', has ? data.shirt_styles.filter((s) => s !== id) : [...data.shirt_styles, id]);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-brand-navy">העדפות כדורגל</h3>
      <p className="mb-5 mt-1 text-sm text-brand-navy/55">נדייק עבורכם חולצות שמתאימות לטעם שלכם. הכל לא חובה.</p>

      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-brand-navy/70">קבוצות שאתם אוהבים</p>
        <TeamPicker values={data.favorite_teams} onChange={(v) => onChange('favorite_teams', v)} />
      </div>

      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-brand-navy/70">שחקנים שאתם אוהבים</p>
        <ChipsInput values={data.favorite_players} onChange={(v) => onChange('favorite_players', v)} placeholder="הקלידו שחקן ולחצו Enter" />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-brand-navy/70">סגנון חולצות</p>
        <div role="group" aria-label="סגנון חולצות" className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <button key={s.id} type="button" onClick={() => toggleStyle(s.id)} aria-pressed={data.shirt_styles.includes(s.id)}
              className={`shop-chip px-5 ${data.shirt_styles.includes(s.id) ? 'shop-chip-active' : ''}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="mt-4 text-center text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex gap-2">
        <button type="button" onClick={onBack} className="shop-btn-secondary px-4">
          <ChevronRight className="h-4 w-4" aria-hidden="true" /> חזרה
        </button>
        <button type="button" onClick={onFinish} disabled={loading} className="shop-btn flex-1">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'סיום ההרשמה'}
        </button>
      </div>
      <div className="mt-3 text-center">
        <button type="button" onClick={onSkip} className="shop-link text-sm">דילוג</button>
      </div>
    </div>
  );
}
