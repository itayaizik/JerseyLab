import React from 'react';
import SettingsForm from '@/components/admin/SettingsForm';

// Relative luminance, for telling the shop when its strip has disappeared into
// the page. The site behind it is white, so that is what the background is
// compared against.
function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  if (x === null || y === null) return null;
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

// What a strip on this site should ever be. Named background first, then the
// text on it. The two with a white background are included because they were
// asked for, and they are the ones the preview warns about: white is the
// colour of the page behind the strip, so only the text gives it an edge.
const COLOUR_PAIRS = [
  { label: 'לבן, טקסט שחור', bg: '#FFFFFF', fg: '#1B2A4A' },
  { label: 'שחור, טקסט לבן', bg: '#1B2A4A', fg: '#FFFFFF' },
  { label: 'כתום, טקסט לבן', bg: '#D0551F', fg: '#FFFFFF' },
  { label: 'לבן, טקסט כתום', bg: '#FFFFFF', fg: '#D0551F' },
];

function TopbarPreview(settings, setSettings) {
  const bg = (settings.topbar_bg || '').trim() || '#D0551F';
  const fg = (settings.topbar_fg || '').trim() || '#FFFFFF';
  const text = (settings.topbar_text || '').trim() || 'כאן יופיע הטקסט של הפס';
  const linkText = (settings.topbar_link_text || '').trim();

  // Against the page, which is white, and against its own text.
  const againstPage = contrast(bg, '#ffffff');
  const againstText = contrast(bg, fg);
  const warnings = [];
  if (againstPage !== null && againstPage < 1.3) warnings.push('הרקע כמעט זהה לצבע של האתר, אז הפס כמעט בלתי נראה. בחר רקע כהה או צבעוני.');
  if (againstText !== null && againstText < 3) warnings.push('הטקסט לא בולט מספיק על הרקע שבחרת.');

  return (
    <div>
      <p className="text-xs text-varnish mb-2">כך הפס ייראה:</p>
      <div className="rounded-xl overflow-hidden border border-brand-line">
        <div style={{ backgroundColor: bg, color: fg }} className="px-4 py-2 text-center text-[13px] font-medium">
          {text}{linkText ? <span className="font-semibold underline underline-offset-2"> {linkText}</span> : null}
        </div>
        {/* A strip of the page under it, so a background that matches the site
            is obvious rather than theoretical. */}
        <div className="bg-white px-4 py-2 text-center text-[11px] text-brand-navy/35">האתר מתחיל כאן</div>
      </div>
      {warnings.map(w => (
        <p key={w} className="mt-2 text-xs font-semibold text-redcard leading-relaxed">{w}</p>
      ))}

      <p className="text-xs text-varnish mt-4 mb-2">או בחר צמד מוכן:</p>
      <div className="flex flex-wrap gap-2">
        {COLOUR_PAIRS.map(pair => {
          const chosen = bg.toLowerCase() === pair.bg.toLowerCase() && fg.toLowerCase() === pair.fg.toLowerCase();
          return (
            <button
              key={pair.label}
              type="button"
              onClick={() => setSettings({ topbar_bg: pair.bg, topbar_fg: pair.fg })}
              aria-pressed={chosen}
              className={`rounded-xl flex items-center gap-2 border px-3 py-2 text-xs transition ${chosen ? 'border-turf bg-turf/10 font-bold text-turf' : 'border-brand-line text-varnish hover:border-turf hover:text-chalk'}`}
            >
              <span className="rounded-md flex h-5 w-8 items-center justify-center border border-brand-line text-[10px] font-bold"
                style={{ backgroundColor: pair.bg, color: pair.fg }}>א</span>
              {pair.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-brand-navy/50 mt-2">הבחירה נשמרת רק אחרי לחיצה על "שמור".</p>
    </div>
  );
}

// The three things that interrupt a visitor, on one page.
//
// They were scattered through ניהול > הגדרות אתר, between the WhatsApp link
// and the "מי אנחנו" text, which is a strange place to decide how fast a
// moving strip should move. They belong together because they compete with
// each other: a strip, a banner and a popup all running at once is three
// interruptions on one visit, and seeing them on one page is the only way to
// notice that.

const GROUPS = [
  {
    title: 'פס הודעה עליון',
    preview: TopbarPreview,
    help: 'הפס שמעל התפריט. ריק או כבוי = לא מוצג כלל. מי שסוגר אותו לא רואה אותו שבוע, וזה כולל אותך - שינוי של הטקסט או של הקישור מחזיר אותו לכולם מיד. לראות אותו בלי לשנות כלום: פתח את האתר עם ?preview=topbar בסוף הכתובת.',
    fields: [
      { key: 'topbar_active', label: 'פעיל?', type: 'select',
        options: [{ value: '', label: 'לא' }, { value: 'yes', label: 'כן' }] },
      { key: 'topbar_text', label: 'טקסט', type: 'text', placeholder: 'משלוח חינם בהזמנה מעל ₪250',
        help: 'משפט אחד קצר.' },
      { key: 'topbar_link_text', label: 'טקסט הקישור', type: 'text', placeholder: 'לפרטים' },
      { key: 'topbar_link_href', label: 'כתובת הקישור', type: 'text', placeholder: '/catalog?sale=true',
        help: 'אם יש כתובת, אפשר ללחוץ על כל רוחב הפס ולא רק על המילים בסוף.' },
      { key: 'topbar_scroll', label: 'האם זז?', type: 'select',
        options: [{ value: '', label: 'לא - טקסט קבוע באמצע' }, { value: 'yes', label: 'כן - טקסט נע' }],
        help: 'תנועה בקצה העין עולה בתשומת לב, אז כברירת מחדל הפס עומד במקום.' },
      { key: 'topbar_direction', label: 'כיוון התנועה', type: 'select',
        options: [{ value: 'rtl', label: 'מימין לשמאל (ככיוון הקריאה)' }, { value: 'ltr', label: 'משמאל לימין' }] },
      { key: 'topbar_speed', label: 'מהירות (שניות לסיבוב)', type: 'text', placeholder: '24',
        help: 'מספר גבוה = איטי יותר. בין 4 ל-300; ריק = 24.' },
      { key: 'topbar_bg', label: 'צבע רקע', type: 'color', placeholder: '#D0551F' },
      { key: 'topbar_fg', label: 'צבע טקסט', type: 'color', placeholder: '#FFFFFF' },
    ],
  },
  {
    title: 'באנר מבצע בדף הבית',
    help: 'תמונה רחבה עם כותרת וכפתור, באמצע דף הבית.',
    fields: [
      { key: 'promo_banner_active', label: 'פעיל?', type: 'select',
        options: [{ value: '', label: 'לא' }, { value: 'yes', label: 'כן' }] },
      { key: 'promo_banner_title', label: 'כותרת ראשית', type: 'text', placeholder: 'מבצע על חולצות סייל' },
      { key: 'promo_banner_subtitle', label: 'תת כותרת', type: 'text', placeholder: 'הנחות מיוחדות לזמן מוגבל' },
      { key: 'promo_banner_button_text', label: 'טקסט הכפתור', type: 'text', placeholder: 'לחולצות הסייל' },
      { key: 'promo_banner_button_link', label: 'קישור הכפתור', type: 'text', placeholder: '/catalog?sale=true' },
      { key: 'promo_banner_image', label: 'תמונת רקע (כתובת)', type: 'text', placeholder: 'https://...' },
    ],
  },
  {
    title: 'פופ-אפ הנחה',
    help: 'נפתח מעצמו אחרי חצי דקה מהכניסה לאתר, פעם אחת לכל מבצע. מי שסגר אותו לא יראה אותו שוב עד שתשנה את הטקסט, וזה כולל אותך - כדי לראות אותו שוב פתח את האתר עם ?preview=popup בסוף הכתובת. לא נפתח מעל הסל או בדף התחברות.',
    fields: [
      { key: 'discount_popup_active', label: 'פעיל?', type: 'select',
        options: [{ value: '', label: 'לא' }, { value: 'yes', label: 'כן' }] },
      { key: 'discount_popup_title', label: 'כותרת', type: 'text', placeholder: 'קוד הנחה על ההזמנה הראשונה' },
      { key: 'discount_popup_text', label: 'טקסט', type: 'textarea', placeholder: 'מזינים את הקוד בסל ומקבלים הנחה על כל ההזמנה.',
        help: 'בלי טקסט הפופ-אפ לא נפתח, גם אם הוא פעיל.' },
      { key: 'discount_popup_code', label: 'קוד קופון', type: 'text', placeholder: 'JL10',
        help: 'הקוד עצמו נוצר בניהול > קופונים. כאן רק כותבים אותו כדי להציג ולהעתיק.' },
      { key: 'discount_popup_button_text', label: 'טקסט הכפתור', type: 'text', placeholder: 'לכל החולצות' },
      { key: 'discount_popup_link', label: 'קישור הכפתור', type: 'text', placeholder: '/catalog' },
      { key: 'discount_popup_delay', label: 'אחרי כמה שניות להיפתח', type: 'text', placeholder: '30' },
    ],
  },
];

export default function ManageBanners() {
  return (
    <SettingsForm
      title="באנרים והודעות"
      intro="שלושת הדברים שקוטעים את הגלישה. שווה להפעיל אחד בכל פעם - שלושה ביחד זה שלוש הפרעות בביקור אחד."
      groups={GROUPS}
    />
  );
}
