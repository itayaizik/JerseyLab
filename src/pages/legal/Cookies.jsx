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
      description="אילו עוגיות ואחסון מקומי JerseyLab משתמש בהם, לשם מה, ואיך אפשר לשלוט בהם."
      intro="בעמוד הזה מפורט בדיוק מה האתר שומר בדפדפן שלך. אין באתר עוגיות פרסום ואין מעקב אחר גולשים בין אתרים."
    >
      <Section title="מה האתר שומר אצלך">
        <Bullets items={[
          'עוגיית התחברות — נוצרת רק אם פתחת חשבון והתחברת, ומאפשרת להישאר מחובר. מנוהלת על ידי Supabase, ספק ההתחברות שלנו. בלעדיה לא ניתן להתחבר.',
          'סל הקניות — נשמר בזיכרון הדפדפן (sessionStorage) ונמחק כשסוגרים את החלון.',
          'פרטי קשר אחרונים — אם שלחת הזמנה, שמך, הטלפון והדוא״ל נשמרים מקומית בדפדפן (localStorage) כדי שלא תצטרך להקליד אותם שוב. הם לא נשלחים לשום מקום מעבר להזמנה עצמה.',
          'סגירת פס ההודעה — אם סגרת את פס ההודעה העליון, נשמרת אצלך סימון שלא להציג אותו שוב.',
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
          עמוד הבית עשוי להציג תוכן מאינסטגרם, ותמונות המוצרים מאוחסנות אצל ספקי אחסון
          תמונות חיצוניים. פנייה לשירותים אלה עשויה לחשוף בפניהם את כתובת ה-IP שלך, בדומה
          לכל גלישה לאתר אחר. איננו שולטים במדיניות שלהם.
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
