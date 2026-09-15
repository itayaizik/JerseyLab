import React from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import TeamPicker from './TeamPicker';
import ChipsInput from './ChipsInput';
import { t } from '@/lib/i18n';

const STYLES = [
  { id: 'retro', label: t('רטרו', 'Retro') },
  { id: 'new', label: t('חדשות', 'New') },
  { id: 'concept', label: t('קונספט', 'Concept') },
  { id: 'national', label: t('נבחרות', 'National teams') },
];

export default function PreferencesStep({ data, onChange, onFinish, onSkip, onBack, loading, error }) {
  const toggleStyle = (id) => {
    const has = data.shirt_styles.includes(id);
    onChange('shirt_styles', has ? data.shirt_styles.filter((s) => s !== id) : [...data.shirt_styles, id]);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-brand-navy">{t('העדפות כדורגל', 'Football preferences')}</h3>
      <p className="mb-5 mt-1 text-sm text-brand-navy/55">{t('נדייק עבורכם חולצות שמתאימות לטעם שלכם. הכל לא חובה.', 'We will pick out shirts to suit your taste. All of this is optional.')}</p>

      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-brand-navy/70">{t('קבוצות שאתם אוהבים', 'Teams you like')}</p>
        <TeamPicker values={data.favorite_teams} onChange={(v) => onChange('favorite_teams', v)} />
      </div>

      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-brand-navy/70">{t('שחקנים שאתם אוהבים', 'Players you like')}</p>
        <ChipsInput values={data.favorite_players} onChange={(v) => onChange('favorite_players', v)} placeholder={t('הקלידו שחקן ולחצו Enter', 'Type a player and press Enter')} />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-brand-navy/70">{t('סגנון חולצות', 'Shirt styles')}</p>
        <div role="group" aria-label={t('סגנון חולצות', 'Shirt styles')} className="flex flex-wrap gap-2">
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
          <ChevronRight className="h-4 w-4" aria-hidden="true" /> {t('חזרה', 'Back')}
        </button>
        <button type="button" onClick={onFinish} disabled={loading} className="shop-btn flex-1">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('סיום ההרשמה', 'Finish signing up')}
        </button>
      </div>
      <div className="mt-3 text-center">
        <button type="button" onClick={onSkip} className="shop-link text-sm">{t('דילוג', 'Skip')}</button>
      </div>
    </div>
  );
}
