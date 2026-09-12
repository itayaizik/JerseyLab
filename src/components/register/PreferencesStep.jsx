import React from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
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
      <h3 className="font-heading font-bold text-lg text-brand-navy mb-1">העדפות כדורגל</h3>
      <p className="text-sm text-gray-500 font-body mb-4">נדייק עבורך חולצות שיתאימו לטעם שלך - הכול אופציונלי</p>

      <div className="mb-4">
        <label className="text-xs font-heading font-bold text-brand-navy/60 uppercase block mb-1.5">קבוצות שאתה אוהב</label>
        <TeamPicker values={data.favorite_teams} onChange={(v) => onChange('favorite_teams', v)} />
      </div>

      <div className="mb-4">
        <label className="text-xs font-heading font-bold text-brand-navy/60 uppercase block mb-1.5">שחקנים שאתה אוהב</label>
        <ChipsInput values={data.favorite_players} onChange={(v) => onChange('favorite_players', v)} placeholder="הקלד שחקן ולחץ Enter" />
      </div>

      <div>
        <label className="text-xs font-heading font-bold text-brand-navy/60 uppercase block mb-1.5">סגנון חולצות</label>
        <div className="grid grid-cols-4 gap-1.5">
          {STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleStyle(s.id)}
              className={`py-2.5 border-2 text-xs font-heading font-bold transition-colors ${
                data.shirt_styles.includes(s.id)
                  ? 'bg-brand-navy text-white border-brand-navy'
                  : 'border-brand-navy/30 text-brand-navy bg-white hover:border-brand-navy'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mt-4 font-body text-center">{error}</p>}

      <div className="flex gap-2 mt-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 px-4 py-3 border-2 border-brand-navy text-brand-navy text-sm font-heading font-bold uppercase hover:bg-brand-cream transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> חזור
        </button>
        <button
          type="button"
          onClick={onFinish}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 bg-brand-orange text-white py-3 text-sm font-heading font-bold uppercase hover:bg-brand-orange-dark transition-colors disabled:opacity-50"
          style={{ boxShadow: '3px 3px 0 var(--brand-navy)' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'סיום הרשמה'}
        </button>
      </div>
      <button type="button" onClick={onSkip} className="w-full text-center text-xs text-brand-navy/50 font-heading font-bold uppercase hover:text-brand-orange mt-3">
        דלג
      </button>
    </div>
  );
}