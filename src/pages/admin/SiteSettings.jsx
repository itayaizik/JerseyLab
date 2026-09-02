import React, { useState, useEffect } from 'react';
import { Save, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const settingFields = [
  { key: 'about_us_text', label: 'טקסט "מי אנחנו"', type: 'textarea',
    help: 'מופיע בדף הבית, וגוגל לוקח ממנו לעיתים את התיאור בתוצאות החיפוש. שורה ריקה יוצרת פסקה חדשה.' },
  { key: 'homepage_hero_title', label: 'כותרת ראשית בדף הבית', type: 'text',
    placeholder: 'חולצות כדורגל איכותיות,|נדירות ובמחירים טובים',
    help: 'הסימן | שובר שורה. מה שאחריו מוצג בכתום.' },
  { key: 'homepage_hero_subtitle', label: 'משפט מתחת לכותרת', type: 'text',
    help: 'שורה אחת קצרה מתחת לכותרת הראשית.' },
  { key: 'chat_proofs_title', label: 'כותרת קטע צילומי השיחות', type: 'text', placeholder: 'לקוחות מספרים',
    help: 'הקטע מופיע רק אם העלית לפחות צילום אחד ב"צילומי שיחות".' },
  { key: 'whatsapp_link', label: 'קישור WhatsApp', type: 'text', placeholder: 'https://wa.me/972...' },
  { key: 'instagram_link', label: 'קישור Instagram', type: 'text', placeholder: 'https://instagram.com/...' },
  { key: 'email', label: 'אימייל', type: 'text' },
  { key: 'contact_message', label: 'הודעת צור קשר', type: 'textarea' },
  { key: 'popular_clubs_title', label: 'כותרת "קבוצות פופולריות"', type: 'text', placeholder: 'קבוצות פופולריות' },
  { key: 'category_cards_title', label: 'כותרת "קנה לפי קטגוריה"', type: 'text', placeholder: 'קנה לפי קטגוריה' },
  { key: 'promo_banner_active', label: 'באנר מבצע — פעיל? (כתוב "yes" להצגה)', type: 'text', placeholder: 'yes' },
  { key: 'promo_banner_title', label: 'באנר — כותרת ראשית', type: 'text', placeholder: 'מבצע ענק על חולצות סייל' },
  { key: 'promo_banner_subtitle', label: 'באנר — תת כותרת', type: 'text', placeholder: 'הנחות מיוחדות לזמן מוגבל' },
  { key: 'promo_banner_button_text', label: 'באנר — טקסט כפתור', type: 'text', placeholder: 'לחולצות הסייל ←' },
  { key: 'promo_banner_button_link', label: 'באנר — קישור כפתור', type: 'text', placeholder: '/catalog?sale=true' },
  { key: 'promo_banner_image', label: 'באנר — תמונת רקע (URL)', type: 'text', placeholder: 'https://...' },
];

export default function SiteSettings() {
  const [settings, setSettings] = useState({});
  const [settingRecords, setSettingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await base44.entities.SiteSetting.list('-created_date', 100);
      setSettingRecords(data);
      const obj = {};
      data.forEach(d => { obj[d.key] = d.value; });
      setSettings(obj);
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    for (const field of settingFields) {
      const existing = settingRecords.find(r => r.key === field.key);
      const value = settings[field.key] || '';
      if (existing) {
        await base44.entities.SiteSetting.update(existing.id, { value });
      } else if (value) {
        await base44.entities.SiteSetting.create({ key: field.key, value });
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="font-heading font-black text-2xl mb-6 text-turf">הגדרות אתר</h1>
      <div className="max-w-2xl space-y-4">
        {settingFields.map(f => (
          <div key={f.key}>
            <label className="text-sm text-varnish block mb-1">{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea
                value={settings[f.key] || ''}
                onChange={e => setSettings(p => ({ ...p, [f.key]: e.target.value }))}
                rows={4}
                className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none resize-none"
              />
            ) : (
              <input
                value={settings[f.key] || ''}
                onChange={e => setSettings(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder || ''}
                dir={f.key.includes('link') || f.key === 'email' ? 'ltr' : 'rtl'}
                className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none"
              />
            )}
            {/* Says where the value shows up, so a field can be changed with
                some idea of what it will do. */}
            {f.help && <p className="text-xs text-white/45 font-body mt-1 leading-relaxed">{f.help}</p>}
          </div>
        ))}
        <button onClick={handleSave} disabled={saving}
          className="bg-turf text-pitch px-6 py-3 font-heading font-bold text-sm hover:bg-turf/90 disabled:opacity-50 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'שומר...' : saved ? 'נשמר!' : 'שמור הגדרות'}
        </button>
      </div>
    </div>
  );
}