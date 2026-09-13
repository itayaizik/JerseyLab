import React from 'react';
import LegalPage, { Section, Bullets } from '@/components/LegalPage';
import { detail, BUSINESS } from '@/lib/business';

// Cookie and tracking policy.
//
// Worth being precise here rather than copying a generic template: this site
// sets no advertising or analytics cookies at all. What it stores is a login
// session, a shopping cart and a couple of conveniences, all of them first
// party. Claiming a cookie banner is needed when nothing is tracked would be as
// wrong as staying silent when something is.

export default function Cookies() {
  return (
    <LegalPage
      title="עוגיות וכלי מעקב"
      path="/legal/cookies"
      updated="2026-09-13"
      description="אילו עוגיות ואחסון מקומי JerseyLab משתמש בהם, לשם מה, ואיך אפשר לשלוט בהם."
      intro="בעמוד הזה מפורט בדיוק מה האתר שומר בדפדפן שלך. אין באתר עוגיות פרסום ואין מעקב אחר גולשים בין אתרים."
    >
      <Section title="מה האתר שומר אצלך">
        <p>
          האתר לא משתמש בעוגיות (cookies). כל מה שנשמר נשמר באחסון המקומי של הדפדפן שלך
          (localStorage, שנשאר עד שמוחקים אותו, או sessionStorage, שנמחק כשסוגרים את
          הדפדפן), ונשאר אצלך במכשיר:
        </p>
        <Bullets items={[
          'חיבור לחשבון — נשמר רק אם פתחת חשבון והתחברת, כדי שתישאר מחובר. מנוהל על ידי Supabase, ספק ההתחברות שלנו. בלעדיו לא ניתן להתחבר. (localStorage)',
          'סל הקניות — החולצות שהוספת לסל, עד שסוגרים את הדפדפן. (sessionStorage)',
          'פרטי קשר אחרונים — אם שלחת הזמנה או בקשה לחולצה, שמך, הטלפון, הדוא״ל וערוץ הקשר שבחרת נשמרים כדי שלא תצטרך להקליד אותם שוב. הם לא נשלחים לשום מקום מעבר להזמנה או לבקשה עצמה. (localStorage)',
          'הגדרות תפריט הנגישות — גודל טקסט, ניגודיות וכל שאר הבחירות בתפריט, כדי שיחולו גם בביקור הבא. אם הסתרת את כפתור הנגישות, הסימון נשמר עד שתסגור את הדפדפן. (localStorage, sessionStorage)',
          'הבאנר בדף הבית — הגדרות התמונה והטקסט של הבאנר הראשי, כדי שיוצג מיד בביקור הבא. אין בהן שום מידע עליך. (localStorage)',
          'סגירת פס ההודעה — אם סגרת את פס ההודעה העליון, נשמר סימון שלא להציג אותו שוב. (localStorage)',
          'סימון טכני לעדכוני האתר — כשהאתר מתעדכן בזמן שהוא פתוח אצלך, נשמר לרגע סימון כדי לטעון את הגרסה החדשה פעם אחת בלבד. (sessionStorage)',
        ]} />
      </Section>

      <Section title="מה האתר לא עושה">
        <Bullets items={[
          'אין עוגיות פרסום ואין פיקסלים של רשתות פרסום.',
          'אין מעקב אחר גלישה שלך באתרים אחרים.',
          'אין העברת מידע לחברות פרסום או דאטה.',
        ]} />
        <p>
          מכיוון שכל האחסון הוא הכרחי לתפעול השירות שביקשת, האתר אינו מציג באנר הסכמה
          לעוגיות. אם בעתיד נוסיף כלי מדידה או פרסום, נעדכן עמוד זה ונבקש את הסכמתך
          מראש.
        </p>
      </Section>

      <Section title="תוכן מוטמע מצדדים שלישיים">
        <p>
          כמה שירותים חיצוניים משמשים להצגת האתר, והדפדפן שלך פונה אליהם ישירות:
        </p>
        <Bullets items={[
          'Google Fonts — הגופן של האתר נטען משרתי גוגל.',
          'Supabase — תמונות המוצרים, ההתחברות לחשבון ושמירת ההזמנות.',
          'Vercel — שרתי האחסון של האתר עצמו.',
          'אינסטגרם — עמוד הבית עשוי להציג תוכן מהחשבון שלנו באינסטגרם.',
        ]} />
        <p>
          פנייה לשירותים אלה חושפת בפניהם את כתובת ה-IP שלך, בדומה לכל גלישה לאתר אחר.
          הם אינם מקבלים מאיתנו מידע נוסף עליך, ואיננו שולטים במדיניות הפרטיות שלהם.
        </p>
      </Section>

      <Section title="איך לשלוט בזה">
        <p>
          אפשר למחוק את כל האחסון המקומי דרך הגדרות הדפדפן, בדרך כלל תחת "נקה נתוני
          גלישה". מחיקה תנתק אותך מהחשבון ותרוקן את הסל, אך לא תפגע במידע שכבר שלחת
          אלינו בהזמנה. לשאלות: {detail(BUSINESS.email)}.
        </p>
      </Section>
    </LegalPage>
  );
}
