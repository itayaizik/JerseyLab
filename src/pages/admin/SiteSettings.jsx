import React, { useState, useEffect } from 'react';
import { Save, Loader2, Check, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { uploadErrorMessage } from '@/lib/supabaseStorage';

const settingFields = [
  { key: 'about_us_text', label: 'טקסט "מי אנחנו"', type: 'textarea',
    help: 'מופיע בדף הבית, וגוגל לוקח ממנו לעיתים את התיאור בתוצאות החיפוש. שורה ריקה יוצרת פסקה חדשה.' },
  { key: 'homepage_hero_image', label: 'באנר ראשי - תמונה למחשב', type: 'image',
    help: 'תמונה רחבה, בערך פי 2 ברוחב מהגובה (למשל 2400×1100). ריק = תמונת ברירת המחדל.' },
  { key: 'homepage_hero_image_mobile', label: 'באנר ראשי - תמונה לטלפון', type: 'image',
    help: 'תמונה לאורך (למשל 1080×1350). ריק = משתמשים בתמונה של המחשב.' },
  { key: 'homepage_hero_link', label: 'באנר ראשי - לאן הלחיצה מובילה', type: 'text', placeholder: '/catalog' },
  { key: 'homepage_hero_card', label: 'באנר ראשי - להציג את הכרטיס הלבן עם הטקסט? (כתוב "no" להסתרה)', type: 'text', placeholder: 'yes',
    help: 'בלי הכרטיס רואים רק את התמונה, וכל התמונה לחיצה.' },
  { key: 'homepage_hero_title', label: 'באנר ראשי - כותרת', type: 'text',
    placeholder: 'חולצות כדורגל|לכל הקבוצות',
    help: 'הסימן | שובר שורה. מה שאחריו מוצג בכתום.' },
  { key: 'homepage_hero_subtitle', label: 'באנר ראשי - משפט מתחת לכותרת', type: 'text',
    placeholder: 'קבוצות, נבחרות ורטרו במקום אחד.' },
  { key: 'homepage_hero_button_text', label: 'באנר ראשי - טקסט הכפתור', type: 'text', placeholder: 'לכל החולצות' },
  { key: 'topbar_active', label: 'פס הודעה עליון - פעיל? (כתוב "yes" להצגה)', type: 'text', placeholder: 'yes',
    help: 'הפס הכתום מעל התפריט. ריק או לא "yes" = לא מוצג כלל.' },
  { key: 'topbar_text', label: 'פס הודעה - טקסט', type: 'text', placeholder: 'משלוח חינם בהזמנה מעל ₪200',
    help: 'משפט אחד קצר. מבקר יכול לסגור אותו, והוא יחזור רק אם תשנה את הטקסט.' },
  { key: 'topbar_link_text', label: 'פס הודעה - טקסט הקישור', type: 'text', placeholder: 'לפרטים' },
  { key: 'topbar_link_href', label: 'פס הודעה - כתובת הקישור', type: 'text', placeholder: '/catalog?sale=true' },
  { key: 'chat_proofs_title', label: 'כותרת קטע צילומי השיחות', type: 'text', placeholder: 'לקוחות מספרים',
    help: 'הקטע מופיע רק אם העלית לפחות צילום אחד ב"צילומי שיחות".' },
  { key: 'whatsapp_link', label: 'קישור WhatsApp', type: 'text', placeholder: 'https://wa.me/972...' },
  { key: 'instagram_link', label: 'קישור Instagram', type: 'text', placeholder: 'https://instagram.com/...' },
  { key: 'email', label: 'אימייל', type: 'text' },
  { key: 'contact_message', label: 'הודעת צור קשר', type: 'textarea' },
  { key: 'popular_clubs_title', label: 'כותרת "קבוצות פופולריות"', type: 'text', placeholder: 'קבוצות פופולריות' },
  { key: 'category_cards_title', label: 'כותרת "קנה לפי קטגוריה"', type: 'text', placeholder: 'קנה לפי קטגוריה' },
  { key: 'promo_banner_active', label: 'באנר מבצע - פעיל? (כתוב "yes" להצגה)', type: 'text', placeholder: 'yes' },
  { key: 'promo_banner_title', label: 'באנר - כותרת ראשית', type: 'text', placeholder: 'מבצע ענק על חולצות סייל' },
  { key: 'promo_banner_subtitle', label: 'באנר - תת כותרת', type: 'text', placeholder: 'הנחות מיוחדות לזמן מוגבל' },
  { key: 'promo_banner_button_text', label: 'באנר - טקסט כפתור', type: 'text', placeholder: 'לחולצות הסייל ←' },
  { key: 'promo_banner_button_link', label: 'באנר - קישור כפתור', type: 'text', placeholder: '/catalog?sale=true' },
  { key: 'promo_banner_image', label: 'באנר - תמונת רקע (URL)', type: 'text', placeholder: 'https://...' },
];

export default function SiteSettings() {
  const [settings, setSettings] = useState({});
  const [settingRecords, setSettingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [uploadError, setUploadError] = useState('');

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

  // Uploads go to the shirt-images bucket like every other admin image; the
  // field only holds the URL, and is saved with the rest.
  const handleImage = async (key, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');
    setUploadingKey(key);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSettings(p => ({ ...p, [key]: file_url }));
    } catch (err) {
      setUploadError(uploadErrorMessage(err));
    } finally {
      setUploadingKey(null);
    }
  };

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
            {f.type === 'image' ? (
              <div className="flex items-start gap-3">
                {settings[f.key] && (
                  <img src={settings[f.key]} alt="" className="h-20 w-32 flex-shrink-0 object-cover border border-white/10" />
                )}
                <div className="flex-1 space-y-2">
                  <input
                    value={settings[f.key] || ''}
                    onChange={e => setSettings(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder="https://... או העלאה"
                    dir="ltr"
                    className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none"
                  />
                  <label className={`inline-flex cursor-pointer items-center gap-2 border border-white/20 px-3 py-1.5 text-xs text-varnish hover:border-turf hover:text-chalk ${uploadingKey === f.key ? 'pointer-events-none opacity-60' : ''}`}>
                    {uploadingKey === f.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {uploadingKey === f.key ? 'מעלה…' : 'העלאת תמונה'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImage(f.key, e)} />
                  </label>
                  {settings[f.key] && (
                    <button type="button" onClick={() => setSettings(p => ({ ...p, [f.key]: '' }))}
                      className="ms-3 text-xs text-white/40 hover:text-redcard">הסרה</button>
                  )}
                </div>
              </div>
            ) : f.type === 'textarea' ? (
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
        {uploadError && <p className="text-redcard text-sm">{uploadError}</p>}
        <button onClick={handleSave} disabled={saving || !!uploadingKey}
          className="bg-turf text-pitch px-6 py-3 font-heading font-bold text-sm hover:bg-turf/90 disabled:opacity-50 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'שומר...' : saved ? 'נשמר!' : 'שמור הגדרות'}
        </button>
      </div>
    </div>
  );
}