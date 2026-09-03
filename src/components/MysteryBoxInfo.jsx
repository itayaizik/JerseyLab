import React from 'react';
import { Check, Ban, Package, Truck, ShieldCheck, HelpCircle } from 'lucide-react';

// Everything a customer needs to know before buying a mystery box, written
// once. The product page runs it down a column; the home page shows the first
// three lines and opens the rest in a dialog. Two copies of this text would
// have drifted apart the first time a price or a policy changed.

export const MYSTERY_BOX_PANELS = [
  {
    icon: Package,
    title: 'מה זה מיסטרי בוקס?',
    paragraphs: [
      'חולצת כדורגל מקורית שאנחנו בוחרים בשבילך, במחיר נמוך משמעותית ממה שהיא עולה בקטלוג. אתה קובע את המסגרת - סגנון, מידה, ומה לא להכניס - ואנחנו בוחרים בתוכה.',
      'זה לא מלאי עודף ולא חולצות פגומות. זו אותה איכות בדיוק כמו כל דבר אחר באתר; מה שמוזל זה ההפתעה, לא המוצר.',
    ],
  },
  {
    icon: Check,
    title: 'מה מקבלים',
    items: [
      'חולצה אחת, במידה שבחרת, מהסגנון שבחרת.',
      'אנחנו בוחרים את הקבוצה, העונה והדגם - זה מה שהופך את זה למיסטרי.',
      'הוספת שם ומספר? גם הם הפתעה - נדפיס את השחקן שמתאים לחולצה שתצא.',
      'נעדכן אותך בדיוק איזו חולצה יצאה לפני שהיא נשלחת.',
    ],
  },
  {
    icon: Ban,
    title: 'מה אפשר לפסול',
    paragraphs: [
      'אתה לא בוחר את החולצה, אבל אתה כן יכול להוציא דברים מהמשחק. בטופס אפשר לרשום קבוצות שלא תרצה לקבל, לסמן צבעים שלא מתאימים לך, ולהוסיף כל הערה חופשית.',
    ],
    items: [
      'קבוצות - יריבות, קבוצות שכבר יש לך, כל סיבה שהיא.',
      'צבעים - למשל אם החולצה מיועדת למישהו שלא לובש אדום.',
      'הערות - ליגה מועדפת, שחקן שתשמח לקבל, או שזו מתנה.',
    ],
    footnote: 'ככל שתפסול יותר, כך מצטמצם המאגר שממנו אנחנו בוחרים - אם לא נשאר לנו ממה לבחור, נחזור אליך לפני שנשלח משהו.',
  },
  {
    icon: ShieldCheck,
    title: 'אם לא אהבת',
    paragraphs: [
      'לפני שהחולצה נשלחת אנחנו מראים לך מה יצא. אם זה לא מתאים - כתוב לנו ונחליף לסגנון אחר, בלי ויכוח. אחרי שהחולצה כבר בדרך אליך אי אפשר להחליף, כי היא כבר הוקצתה עבורך.',
    ],
  },
  {
    icon: Truck,
    title: 'זמני אספקה',
    paragraphs: [
      'מיסטרי בוקס מגיע מהמלאי הכללי שלנו, כך שזמן ההגעה זהה להזמנה רגילה - נעדכן אותך בזמן המדויק כשנחזור אליך לאישור ההזמנה.',
    ],
  },
  {
    icon: HelpCircle,
    title: 'למה זה זול יותר?',
    paragraphs: [
      'כי אנחנו בוחרים. חולצות מסוימות יושבות אצלנו הרבה זמן פשוט כי אף אחד לא חיפש בדיוק אותן - לא בגלל שמשהו לא בסדר בהן. המיסטרי בוקס מוציא אותן לדרך, ואתה מקבל את ההנחה.',
    ],
  },
];

// The three lines worth showing before someone has committed to reading.
export const MYSTERY_BOX_HIGHLIGHTS = [
  'אתה בוחר סגנון ומידה - אנחנו בוחרים את החולצה',
  'אפשר לפסול קבוצות וצבעים שלא תרצה לקבל',
  'רואה מה יצא לפני המשלוח, ואפשר להחליף',
];

export default function MysteryBoxInfo({ compact = false }) {
  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      {MYSTERY_BOX_PANELS.map(panel => {
        const Icon = panel.icon;
        return (
          <section key={panel.title}
            className={compact ? 'border-b-2 border-[#1B2A4A]/10 pb-4 last:border-b-0 last:pb-0' : 'bg-white border-2 border-[#1B2A4A] p-5'}
            style={compact ? undefined : { boxShadow: '3px 3px 0 #1B2A4A' }}>
            <h3 className={`flex items-center gap-2 font-heading font-bold text-[#1B2A4A] uppercase tracking-wide mb-3 ${compact ? 'text-sm' : 'text-base'}`}>
              <span className={`flex-shrink-0 bg-[#E8622A] flex items-center justify-center ${compact ? 'w-6 h-6' : 'w-7 h-7'}`}>
                <Icon className={compact ? 'w-3.5 h-3.5 text-white' : 'w-4 h-4 text-white'} />
              </span>
              {panel.title}
            </h3>

            <div className={`space-y-2.5 font-body text-[#1B2A4A]/75 leading-relaxed ${compact ? 'text-[13px]' : 'text-sm'}`}>
              {panel.paragraphs?.map(p => <p key={p}>{p}</p>)}

              {panel.items && (
                <ul className="space-y-2">
                  {panel.items.map(line => (
                    <li key={line} className="flex gap-2">
                      <Check className="w-4 h-4 text-[#E8622A] flex-shrink-0 mt-0.5" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}

              {panel.footnote && <p className="text-[#1B2A4A]/55">{panel.footnote}</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
