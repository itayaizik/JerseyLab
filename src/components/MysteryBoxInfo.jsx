import React from 'react';
import { Check, Ban, Package, Truck, ShieldCheck, HelpCircle } from 'lucide-react';

// Everything a customer needs to know before buying a mystery box, written
// once. The product page runs it down a column; the home page shows the first
// three lines. Two copies of this text would have drifted apart the first time
// a price or a policy changed.

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
    <div className={compact ? 'divide-y divide-brand-line' : 'grid gap-4 md:grid-cols-2'}>
      {MYSTERY_BOX_PANELS.map(panel => {
        const Icon = panel.icon;
        return (
          <section key={panel.title} className={compact ? 'py-5 first:pt-0 last:pb-0' : 'rounded-3xl bg-brand-mist p-6'}>
            <h3 className={`flex items-center gap-2.5 font-semibold text-brand-navy ${compact ? 'text-[15px]' : 'text-base'}`}>
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-orange-soft text-brand-orange-ink">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              {panel.title}
            </h3>

            <div className={`mt-3 space-y-2.5 leading-relaxed text-brand-navy/70 ${compact ? 'text-[13px]' : 'text-sm'}`}>
              {panel.paragraphs?.map(p => <p key={p}>{p}</p>)}

              {panel.items && (
                <ul className="space-y-2">
                  {panel.items.map(line => (
                    <li key={line} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}

              {panel.footnote && <p className="text-brand-navy/50">{panel.footnote}</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
