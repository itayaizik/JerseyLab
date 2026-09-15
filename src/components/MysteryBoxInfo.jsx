import React from 'react';
import { Check, Ban, Package, Truck, ShieldCheck, HelpCircle } from 'lucide-react';
import { t } from '@/lib/i18n';

// Everything a customer needs to know before buying a mystery box, written
// once. The product page runs it down a column; the home page shows the first
// three lines. Two copies of this text would have drifted apart the first time
// a price or a policy changed.

export const MYSTERY_BOX_PANELS = [
  {
    id: 'what',
    icon: Package,
    title: t('מה זה מיסטרי בוקס?', 'What is a Mystery Box?'),
    paragraphs: [
      t('חולצת כדורגל אקראית, בהפתעה. אתה קובע את המסגרת - סגנון, מידה, ומה לא להכניס - והחולצה יוצאת באקראיות מתוך מה שנשאר.',
        "A random football shirt, as a surprise. You set the frame - style, size and what to leave out - and the shirt is drawn at random from what's left."),
      t('זה לא מלאי עודף ולא חולצות פגומות. זו אותה איכות ואותו מחיר כמו כל חולצה באתר; ההבדל היחיד הוא שאתה לא יודע מה יצא.',
        "It isn't leftover stock or faulty shirts. It's the same quality and the same price as every shirt on the site; the only difference is that you don't know what you'll get."),
    ],
  },
  {
    id: 'get',
    icon: Check,
    title: t('מה מקבלים', 'What you get'),
    items: [
      t('חולצה אחת, במידה שבחרת, מהסגנון שבחרת.', 'One shirt, in the size and style you chose.'),
      t('הקבוצה, העונה והדגם יוצאים אקראית - זה מה שהופך את זה למיסטרי.', 'The team, season and design come out at random - that is what makes it a mystery.'),
      t('אפשר להוסיף שרוול ארוך או מכנס קצר תואם, כמו בכל חולצה.', 'You can add long sleeves or matching shorts, as with any shirt.'),
      t('הוספת שם ומספר? גם הם הפתעה - נדפיס את השחקן שמתאים לחולצה שתצא.', 'Added a name and number? Those are a surprise too - we print a player who fits the shirt that comes out.'),
      t('נעדכן אותך בדיוק איזו חולצה יצאה לפני שהיא נשלחת.', "We'll tell you exactly which shirt came out before it ships."),
    ],
  },
  {
    id: 'exclude',
    icon: Ban,
    title: t('מה אפשר לפסול', 'What you can rule out'),
    paragraphs: [
      t('אתה לא בוחר את החולצה, אבל אתה כן יכול להוציא דברים מהמשחק. בטופס אפשר לרשום קבוצות שלא תרצה לקבל, לסמן צבעים שלא מתאימים לך, ולהוסיף כל הערה חופשית.',
        "You don't choose the shirt, but you can take things out of the draw. In the form you can list teams you don't want, mark colours that don't suit you, and add any note you like."),
    ],
    items: [
      t('קבוצות - יריבות, קבוצות שכבר יש לך, כל סיבה שהיא.', 'Teams - rivals, teams you already have, any reason at all.'),
      t('צבעים - למשל אם החולצה מיועדת למישהו שלא לובש אדום.', "Colours - say, if the shirt is for someone who doesn't wear red."),
      t('הערות - ליגה מועדפת, שחקן שתשמח לקבל, או שזו מתנה.', "Notes - a favourite league, a player you'd love, or that it's a gift."),
    ],
    footnote: t('ככל שתפסול יותר, כך מצטמצם המאגר שממנו החולצה יוצאת - אם לא נשאר ממה להגריל, נחזור אליך לפני שנשלח משהו.',
      "The more you rule out, the smaller the pool the shirt is drawn from - if there's nothing left to draw from, we'll get back to you before sending anything."),
  },
  {
    id: 'dislike',
    icon: ShieldCheck,
    title: t('אם לא אהבת', "If you don't like it"),
    paragraphs: [
      t('לפני שהחולצה נשלחת אנחנו מראים לך מה יצא. אם זה לא מתאים - כתוב לנו ונחליף לסגנון אחר, בלי ויכוח. אחרי שהחולצה כבר בדרך אליך אי אפשר להחליף, כי היא כבר הוקצתה עבורך.',
        "Before the shirt ships we show you what came out. If it doesn't suit you, write to us and we'll swap it for another style, no argument. Once the shirt is on its way it can't be swapped, because it has already been set aside for you."),
    ],
  },
  {
    id: 'delivery',
    icon: Truck,
    title: t('זמני אספקה', 'Delivery times'),
    paragraphs: [
      t('מיסטרי בוקס מגיע מהמלאי הכללי שלנו, כך שזמן ההגעה זהה להזמנה רגילה - נעדכן אותך בזמן המדויק כשנחזור אליך לאישור ההזמנה.',
        "A Mystery Box comes from our general stock, so it arrives in the same time as a regular order - we'll give you the exact time when we get back to you to confirm the order."),
    ],
  },
  {
    id: 'why',
    icon: HelpCircle,
    title: t('למה מיסטרי בוקס?', 'Why a Mystery Box?'),
    paragraphs: [
      t('בשביל ההפתעה. במקום לבחור חולצה מהקטלוג, אתה נותן לאקראיות להחליט - ואולי מקבל קבוצה או עונה שלא היית חושב עליהן בכלל. המחיר זהה לחולצה רגילה.',
        "For the surprise. Instead of picking a shirt from the catalog, you let chance decide - and maybe get a team or a season you'd never have thought of. The price is the same as a regular shirt."),
    ],
  },
];

// The three lines worth showing before someone has committed to reading.
export const MYSTERY_BOX_HIGHLIGHTS = [
  t('אתה בוחר סגנון ומידה - החולצה יוצאת אקראית', 'You choose the style and size - the shirt comes out at random'),
  t('אפשר לפסול קבוצות וצבעים שלא תרצה לקבל', "Rule out teams and colours you don't want"),
  t('רואה מה יצא לפני המשלוח, ואפשר להחליף', 'See what came out before it ships, and swap if you like'),
];

export default function MysteryBoxInfo({ compact = false }) {
  return (
    <div className={compact ? 'divide-y divide-brand-line' : 'grid gap-4 md:grid-cols-2'}>
      {MYSTERY_BOX_PANELS.map(panel => {
        const Icon = panel.icon;
        return (
          <section key={panel.id} className={compact ? 'py-5 first:pt-0 last:pb-0' : 'rounded-3xl bg-brand-mist p-6'}>
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
