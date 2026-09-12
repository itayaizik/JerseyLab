import React from 'react';
import LegalPage, { Section, Bullets, Fact } from '@/components/LegalPage';
import { BUSINESS } from '@/lib/business';

// Accessibility statement, per regulation 35 of the Equal Rights for Persons
// with Disabilities (Service Accessibility) Regulations, 2013.
//
// The regulations require this to be an HTML page with real, selectable text —
// not a PDF, a Word file or an image — reachable from the footer of every page,
// and to name a person who can be contacted directly about accessibility.
//
// The statement describes what was actually done. Where conformance is partial
// it says so, because a statement claiming more than the site delivers is worse
// than no statement: it is the thing a complaint is measured against.

export default function Accessibility() {
  const coord = BUSINESS.accessibilityCoordinator;

  return (
    <LegalPage
      title="הצהרת נגישות"
      path="/legal/accessibility"
      description="הצהרת הנגישות של JerseyLab: רמת ההנגשה של האתר, ההתאמות שבוצעו, מגבלות ידועות, ופרטי רכז הנגישות."
      intro="אנחנו רואים בנגישות האתר חלק מהשירות, לא תוספת. בעמוד הזה מפורט מה נעשה, מה עדיין לא, ואיך לפנות אלינו אם משהו לא עובד עבורך."
    >
      <Section title="המחויבות שלנו">
        <p>
          {BUSINESS.tradingName} פועל להנגשת האתר כך שיהיה שמיש עבור כמה שיותר אנשים,
          לרבות אנשים עם מוגבלות. אנחנו פועלים להתאמת האתר להוראות תקנות שוויון זכויות
          לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013, ולתקן הישראלי ת"י 5568
          המבוסס על הנחיות <span dir="ltr">WCAG 2.0</span> ברמה AA.
        </p>
      </Section>

      <Section title="מה בוצע באתר">
        <Bullets items={[
          'האתר נבנה במבנה סמנטי: כותרות מדורגות, אזורי ניווט מסומנים, וטפסים שבהם לכל שדה יש תווית קבועה.',
          'ניתן להפעיל את כל האתר באמצעות מקלדת בלבד, וקיים סימון ברור וגלוי למוקד המקלדת.',
          'קיים קישור "דלג לתוכן הראשי" בתחילת כל עמוד.',
          'לכל תמונת מוצר יש טקסט חלופי המתאר אותה.',
          'אזורי הלחיצה במובייל תוכננו בגודל מינימלי של 44 פיקסלים.',
          'האתר תומך בהגדלת טקסט בדפדפן ובשינוי גודל החלון בלי אובדן תוכן או גלילה לרוחב.',
          'הודעות שגיאה בטפסים מוצגות בטקסט ולא בצבע בלבד.',
          'האתר כתוב בעברית עם כיווניות RTL מוצהרת, כך שקוראי מסך מקריאים אותו נכון.',
        ]} />
      </Section>

      <Section title="מגבלות ידועות">
        <p>
          למרות מאמצינו, ייתכנו באתר חלקים שטרם הונגשו במלואם. הידועים לנו כרגע:
        </p>
        <Bullets items={[
          'חלק מתמונות המוצרים מגיעות מספקים חיצוניים, ואיכותן ורזולוציית התצוגה שלהן אינן בשליטתנו המלאה.',
          'תוכן המוטמע מרשתות חברתיות (אינסטגרם) כפוף לנגישות של אותה פלטפורמה.',
          'צילומי שיחות עם לקוחות מוצגים כתמונות. אם תוכן כזה נדרש לך בטקסט, נשמח לספק אותו בפנייה אלינו.',
        ]} />
        <p>
          אנחנו ממשיכים לתקן ולשפר. אם נתקלת בקושי שאינו מופיע כאן, נשמח לדעת עליו.
        </p>
      </Section>

      <Section title="פנייה בנושא נגישות">
        <p>
          אם נתקלת בבעיית נגישות באתר, או שיש לך בקשה להתאמה, אפשר לפנות ישירות לרכז
          הנגישות שלנו. נשתדל לטפל בפנייה בהקדם.
        </p>
        <dl className="mt-2">
          <Fact label="רכז נגישות" value={coord.name} />
          <Fact label="טלפון" value={coord.phone} />
          <Fact label="דוא״ל" value={coord.email} />
        </dl>
      </Section>

      <Section title="הנגשה פיזית">
        <p>
          {BUSINESS.tradingName} הוא עסק מקוון ואינו מפעיל חנות פתוחה לקהל. איסוף עצמי
          מתבצע בתיאום מראש בלבד. אם נדרשת התאמת נגישות לצורך איסוף, פנו אלינו מראש
          ונמצא פתרון.
        </p>
      </Section>

      <Section title="אם הפנייה לא נענתה">
        <p>
          אם פנית אלינו ולא קיבלת מענה מספק, ניתן להגיש תלונה לנציבות שוויון זכויות
          לאנשים עם מוגבלות במשרד המשפטים, דרך אתר{' '}
          <a href="https://www.gov.il/he/service/complaint_discrimination_inaccessibility_people_with_disabilities"
            target="_blank" rel="noopener noreferrer"
            className="text-brand-orange font-bold hover:underline">
            gov.il
          </a>.
        </p>
      </Section>
    </LegalPage>
  );
}
