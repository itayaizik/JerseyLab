import React, { useState, useEffect } from 'react';
import { Save, Loader2, Check, Upload, RotateCcw, ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { uploadErrorMessage } from '@/lib/supabaseStorage';
import { HERO_DEFAULTS } from '@/components/HomeHero';

// The home page banner has its own block at the top, because its photo is the
// thing most often changed: pick a file and it is live, no save button needed.
const HERO_IMAGES = [
  { key: 'homepage_hero_image', label: 'תמונה למחשב', fallback: HERO_DEFAULTS.desktop, frame: 'aspect-[16/9]',
    help: 'תמונה רחבה, למשל 2400×1300. היא ממלאת את כל רוחב המסך, אז הקצוות למעלה ולמטה עלולים להיחתך.' },
  { key: 'homepage_hero_image_mobile', label: 'תמונה לטלפון', fallback: HERO_DEFAULTS.mobile, frame: 'aspect-[9/16]',
    help: 'תמונה לאורך, למשל 1080×1920. ריק = משתמשים בתמונה של המחשב.' },
];

const heroFields = [
  { key: 'homepage_hero_title', label: 'כותרת', type: 'text', placeholder: HERO_DEFAULTS.title,
    help: 'הסימן | שובר שורה. הכי יפה במילה או שתיים בכל שורה, למשל: עונת|26/27|כבר כאן' },
  { key: 'homepage_hero_subtitle', label: 'משפט מתחת לכותרת', type: 'text', placeholder: HERO_DEFAULTS.subtitle },
  { key: 'homepage_hero_button_text', label: 'טקסט הכפתור', type: 'text', placeholder: HERO_DEFAULTS.button },
  { key: 'homepage_hero_link', label: 'לאן הלחיצה מובילה', type: 'text', placeholder: HERO_DEFAULTS.link },
];

const settingFields = [
  { key: 'about_us_text', label: 'טקסט "מי אנחנו"', type: 'textarea',
    help: 'מופיע בדף הבית, וגוגל לוקח ממנו לעיתים את התיאור בתוצאות החיפוש. שורה ריקה יוצרת פסקה חדשה.' },
  { key: 'topbar_active', label: 'פס הודעה עליון - פעיל? (כתוב "yes" להצגה)', type: 'text', placeholder: 'yes',
    help: 'הפס הכתום מעל התפריט. ריק או לא "yes" = לא מוצג כלל.' },
  { key: 'topbar_text', label: 'פס הודעה - טקסט', type: 'text', placeholder: 'משלוח חינם בהזמנה מעל ₪200',
    help: 'משפט אחד קצר. מבקר יכול לסגור אותו, והוא יחזור רק אם תשנה את הטקסט.' },
  { key: 'topbar_link_text', label: 'פס הודעה - טקסט הקישור', type: 'text', placeholder: 'לפרטים' },
  { key: 'topbar_link_href', label: 'פס הודעה - כתובת הקישור', type: 'text', placeholder: '/catalog?sale=true' },
  { key: 'chat_proofs_title', label: 'כותרת קטע "לקוחות מספרים"', type: 'text', placeholder: 'לקוחות מספרים',
    help: 'הקטע מופיע אם יש לפחות צילום שיחה אחד, או ביקורת עם תמונה שסימנת להצגה.' },
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

// Everything the save button writes. The hero photos and the card switch save
// themselves the moment they change.
const SAVED_WITH_BUTTON = [...heroFields, ...settingFields];

const inputClass = 'w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none';

export default function SiteSettings() {
  const [settings, setSettings] = useState({});
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [savedKey, setSavedKey] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const data = await base44.entities.SiteSetting.list('-created_date', 100);
      setRecords(data);
      const obj = {};
      data.forEach(d => { obj[d.key] = d.value; });
      setSettings(obj);
      setLoading(false);
    }
    load();
  }, []);

  // Writes one setting, creating its row the first time. The new row is kept,
  // so saving again updates it instead of adding a second one.
  const writeSetting = async (key, value, known = records) => {
    const existing = known.find(r => r.key === key);
    if (existing) {
      await base44.entities.SiteSetting.update(existing.id, { value });
      return known;
    }
    if (!value) return known;
    const created = await base44.entities.SiteSetting.create({ key, value });
    return created ? [...known, created] : known;
  };

  const saveNow = async (key, value) => {
    setError('');
    setSettings(p => ({ ...p, [key]: value }));
    try {
      const next = await writeSetting(key, value);
      setRecords(next);
      setSavedKey(key);
      setTimeout(() => setSavedKey(k => (k === key ? null : k)), 2500);
    } catch {
      setError('השמירה נכשלה. נסה שוב.');
    }
  };

  // Uploads go to the shirt-images bucket like every other admin image, and
  // the new photo is on the site as soon as it is saved.
  const handleImage = async (key, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploadingKey(key);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await saveNow(key, file_url);
    } catch (err) {
      setError(uploadErrorMessage(err));
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      let known = records;
      for (const field of SAVED_WITH_BUTTON) {
        known = await writeSetting(field.key, settings[field.key] || '', known);
      }
      setRecords(known);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('השמירה נכשלה. נסה שוב.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" /></div>;

  const renderField = (f) => (
    <div key={f.key}>
      <label htmlFor={`setting-${f.key}`} className="text-sm text-varnish block mb-1">{f.label}</label>
      {f.type === 'textarea' ? (
        <textarea id={`setting-${f.key}`} value={settings[f.key] || ''} rows={4}
          onChange={e => setSettings(p => ({ ...p, [f.key]: e.target.value }))}
          className={`${inputClass} resize-none`} />
      ) : (
        <input id={`setting-${f.key}`} value={settings[f.key] || ''} placeholder={f.placeholder || ''}
          onChange={e => setSettings(p => ({ ...p, [f.key]: e.target.value }))}
          dir={f.key.includes('link') || f.key.includes('href') || f.key === 'email' ? 'ltr' : 'rtl'}
          className={inputClass} />
      )}
      {/* Says where the value shows up, so a field can be changed with some
          idea of what it will do. */}
      {f.help && <p className="text-xs text-white/45 font-body mt-1 leading-relaxed">{f.help}</p>}
    </div>
  );

  const showCard = settings.homepage_hero_card !== 'no';

  return (
    <div>
      <h1 className="font-heading font-black text-2xl mb-6 text-turf">הגדרות אתר</h1>

      {/* ===== Home banner ===== */}
      <section className="max-w-3xl border border-white/10 bg-white/5 p-5 mb-8">
        <h2 className="font-heading font-bold text-lg text-chalk">באנר ראשי בדף הבית</h2>
        <p className="text-xs text-white/50 mt-1 mb-5">בחירת תמונה מעלה ושומרת אותה מיד. אין צורך ללחוץ על "שמור".</p>

        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_11rem]">
          {HERO_IMAGES.map(img => {
            const custom = settings[img.key];
            const busy = uploadingKey === img.key;
            return (
              <div key={img.key} className="flex flex-col">
                <p className="text-sm text-varnish mb-2">{img.label}</p>
                <div className={`relative overflow-hidden border border-white/15 bg-black/40 ${img.frame}`}>
                  <img src={custom || (img.key === 'homepage_hero_image_mobile' && settings.homepage_hero_image) || img.fallback}
                    alt="" className="absolute inset-0 h-full w-full object-cover" />
                  {!custom && (
                    <span className="absolute top-2 start-2 bg-black/70 px-2 py-0.5 text-[11px] text-white/80">
                      {img.key === 'homepage_hero_image_mobile' && settings.homepage_hero_image ? 'כמו במחשב' : 'ברירת מחדל'}
                    </span>
                  )}
                  {busy && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <Loader2 className="w-6 h-6 animate-spin text-turf" />
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className={`inline-flex cursor-pointer items-center gap-2 bg-turf px-3 py-2 text-xs font-bold text-pitch hover:bg-turf/90 ${busy ? 'pointer-events-none opacity-60' : ''}`}>
                    {custom ? <Upload className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                    {busy ? 'מעלה…' : 'החלפת תמונה'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImage(img.key, e)} disabled={busy} />
                  </label>
                  {custom && (
                    <button type="button" onClick={() => saveNow(img.key, '')}
                      className="inline-flex items-center gap-1.5 border border-white/20 px-3 py-2 text-xs text-varnish hover:text-chalk">
                      <RotateCcw className="w-3.5 h-3.5" /> ברירת מחדל
                    </button>
                  )}
                  {savedKey === img.key && <span className="inline-flex items-center gap-1 text-xs text-turf"><Check className="w-3.5 h-3.5" /> נשמר</span>}
                </div>
                <p className="text-xs text-white/45 mt-1.5 leading-relaxed">{img.help}</p>
              </div>
            );
          })}
        </div>

        <label className="mt-6 flex cursor-pointer items-center gap-3 border-t border-white/10 pt-5">
          <input type="checkbox" checked={showCard} onChange={e => saveNow('homepage_hero_card', e.target.checked ? 'yes' : 'no')}
            className="h-4 w-4 accent-[#E8622A]" />
          <span className="text-sm text-chalk">להציג את הכרטיס הלבן עם הכותרת והכפתור</span>
          {savedKey === 'homepage_hero_card' && <span className="inline-flex items-center gap-1 text-xs text-turf"><Check className="w-3.5 h-3.5" /> נשמר</span>}
        </label>
        <p className="text-xs text-white/45 mt-1 ms-7">בלי הכרטיס רואים רק את התמונה, וכל התמונה לחיצה.</p>

        <div className={`mt-5 grid gap-4 sm:grid-cols-2 ${showCard ? '' : 'opacity-50'}`}>
          {heroFields.map(renderField)}
        </div>
      </section>

      {/* ===== Everything else ===== */}
      <div className="max-w-2xl space-y-4">
        {settingFields.map(renderField)}
        {error && <p className="text-redcard text-sm">{error}</p>}
        <button onClick={handleSave} disabled={saving || !!uploadingKey}
          className="bg-turf text-pitch px-6 py-3 font-heading font-bold text-sm hover:bg-turf/90 disabled:opacity-50 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'שומר...' : saved ? 'נשמר!' : 'שמור הגדרות'}
        </button>
      </div>
    </div>
  );
}
