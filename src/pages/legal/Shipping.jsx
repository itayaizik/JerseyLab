import React from 'react';
import LegalPage, { Section, Bullets, Fact } from '@/components/LegalPage';
import { BUSINESS, detail } from '@/lib/business';

// Shipping, delivery and cancellation.
//
// Cancellation is folded in here rather than left out, because a web shop is a
// distance-selling transaction under the Consumer Protection Law 5741-1981 and
// the 14-day right to cancel applies whether or not the shop mentions it. A
// shop that stays silent on it is not thereby exempt, only less clear — so the
// right, its window and its limits are all stated.

export default function Shipping() {
  const s = BUSINESS.shipping;

  return (
    <LegalPage
      title="משלוחים, אספקה וביטול"
      path="/legal/shipping"
      description="זמני אספקה, עלויות משלוח, איסוף עצמי, וזכות הביטול לפי חוק הגנת הצרכן."
      intro="כמה זמן לוקח, כמה זה עולה, ומה הזכויות שלך אם החלטת לבטל."
    >
      <Section title="זמני אספקה">
        <p>
          זמן האספקה תלוי בשאלה אם הפריט נמצא במלאי בארץ או מוזמן במיוחד. הסטטוס מופיע
          על כל חולצה בעמוד המוצר.
        </p>
        <dl className="mt-2">
          <Fact label="מלאי בארץ" value={s.localStockDays} />
          <Fact label="הזמנה מיוחדת" value={s.specialOrderWeeks} />
          <Fact label="איסוף עצמי" value={`בתיאום מראש, ${s.pickupLocation}`} />
        </dl>
        <p>
          הספירה מתחילה מרגע אישור ההזמנה והתשלום מולנו, לא מרגע שליחת הטופס באתר.
          זמני האספקה אינם כוללים שישי, שבת וחגים.
        </p>
      </Section>

      <Section title="עלות משלוח">
        <dl>
          {s.price !== null && <Fact label="דמי משלוח" value={s.price} />}
          {s.freeAbove !== null && <Fact label="משלוח חינם מעל" value={s.freeAbove} />}
          {s.carrier !== null && <Fact label="חברת השילוח" value={s.carrier} />}
        </dl>
        <p>
          עלות המשלוח המדויקת תימסר לך בשיחה לפני אישור ההזמנה, ולפני כל תשלום.
        </p>
      </Section>

      <Section title="עיכובים">
        <p>
          פריט בהזמנה מיוחדת מגיע מספק בחו״ל, ולעיתים נדירות מתעכב מעבר לצפוי. במקרה כזה
          נעדכן אותך, ותוכל לבחור להמתין או לבטל ולקבל החזר מלא.
        </p>
      </Section>

      <Section title="זכות ביטול">
        <p>
          רכישה דרך האתר היא עסקת מכר מרחוק לפי חוק הגנת הצרכן, התשמ״א-1981. לכן:
        </p>
        <Bullets items={[
          'ניתן לבטל את העסקה בתוך 14 ימים מיום קבלת המוצר או מיום קבלת מסמך פרטי העסקה, לפי המאוחר מביניהם.',
          'הביטול ייעשה בהודעה בכתב אלינו — בוואטסאפ, באינסטגרם או בדוא״ל — ויכלול את שמך ומספר ההזמנה.',
          'לאדם עם מוגבלות, אזרח ותיק או עולה חדש עומדת תקופת ביטול של עד 4 חודשים, בעסקה שנעשתה בשיחה שכללה הסבר, ובהצגת תעודה מתאימה.',
          'בביטול שאינו עקב פגם, ניתן לחייב בדמי ביטול של עד 5% ממחיר העסקה או 100 ש״ח, לפי הנמוך.',
          'המוצר יוחזר באריזתו המקורית, ללא שימוש וללא פגיעה בתוויות. עלות ההחזרה על הלקוח, אלא אם הביטול עקב פגם או אי-התאמה.',
        ]} />
        <p>
          <strong>שים לב:</strong> חולצה שהודפס עליה שם או מספר לפי בקשתך היא מוצר שיוצר
          במיוחד עבורך, ולפי החוק לא חלה עליה זכות ביטול, למעט במקרה של פגם או אי-התאמה.
          לכן אנחנו מוודאים איתך את פרטי ההדפסה לפני הביצוע.
        </p>
      </Section>

      <Section title="מוצר פגום או שאינו תואם">
        <p>
          אם קיבלת פריט פגום, שגוי או שאינו תואם למה שסוכם, פנו אלינו מיד ונתקן על
          חשבוננו: החלפה, תיקון או החזר כספי מלא, לפי בחירתך ובהתאם לדין.
        </p>
      </Section>

      <Section title="מיסטרי בוקס">
        <p>
          במיסטרי בוקס אנחנו בוחרים את החולצה, וזהו טיב המוצר שנרכש. לפני המשלוח נראה לך
          איזו חולצה יצאה; אם אינה מתאימה, אפשר לבקש החלפה לסגנון אחר באותו שלב. לאחר
          המשלוח חלה זכות הביטול הרגילה שפורטה לעיל.
        </p>
      </Section>

      <Section title="יצירת קשר בנושא הזמנה">
        <p>
          בוואטסאפ <span dir="ltr">{BUSINESS.phone}</span>, באינסטגרם{' '}
          <span dir="ltr">@{BUSINESS.instagram}</span>, או בדוא״ל {detail(BUSINESS.email)}.
        </p>
      </Section>
    </LegalPage>
  );
}
