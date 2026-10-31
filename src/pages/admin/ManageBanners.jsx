import React from 'react';
import SettingsForm from '@/components/admin/SettingsForm';

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
    help: 'הפס שמעל התפריט. ריק או כבוי = לא מוצג כלל. מבקר יכול לסגור אותו, והוא יחזור רק אם תשנה את הטקסט.',
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
    help: 'נפתח מעצמו אחרי חצי דקה מהכניסה לאתר, פעם אחת לכל מבצע. מי שסגר אותו לא יראה אותו שוב עד שתשנה את הטקסט. לא נפתח מעל הסל או בדף התחברות.',
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
