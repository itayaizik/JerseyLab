import React from 'react';
import LegalPage, { Section, Fact } from '@/components/LegalPage';
import { BUSINESS, detail } from '@/lib/business';
import { WHATSAPP_URL, INSTAGRAM_URL } from '@/lib/contact';

// Business identity page.
//
// The Consumer Protection Law obliges a distance seller to publish their full
// name, their ID or company number and their address. Scattering those across
// a privacy policy and a contact form technically satisfies nobody, so they get
// one page, linked from the footer, that a customer or a regulator can point at.

export default function BusinessDetails() {
  return (
    <LegalPage
      title="פרטי העסק"
      path="/legal/business"
      description="פרטי העסק של JerseyLab: מי עומד מאחורי האתר, כתובת ודרכי יצירת קשר, כנדרש בחוק הגנת הצרכן."
      intro="הפרטים המלאים של מי שעומד מאחורי האתר, כנדרש בחוק הגנת הצרכן לעסקת מכר מרחוק."
    >
      <Section title="זהות העסק">
        <dl>
          <Fact label="שם מסחרי" value={BUSINESS.tradingName} />
          <Fact label="שם בעל העסק" value={BUSINESS.legalName} />
          {BUSINESS.registered && (
            <>
              <Fact label="סוג רישום" value={BUSINESS.registrationType} />
              <Fact label="מספר עוסק / ח.פ." value={BUSINESS.registrationNumber} />
            </>
          )}
          <Fact label="כתובת" value={BUSINESS.address} />
        </dl>
      </Section>

      <Section title="יצירת קשר">
        <dl>
          <Fact label="טלפון ווואטסאפ" value={BUSINESS.phone} />
          <Fact label="דוא״ל" value={BUSINESS.email} />
          <Fact label="אינסטגרם" value={`@${BUSINESS.instagram}`} />
        </dl>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="shop-btn-dark">
            וואטסאפ
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="shop-btn-secondary">
            אינסטגרם
          </a>
        </div>
      </Section>

      <Section title="שעות מענה">
        <p>
          אנחנו עונים בוואטסאפ ובאינסטגרם בדרך כלל תוך מספר שעות בימים א׳ עד ה׳. פניות
          שמגיעות בסופי שבוע ובחגים נענות ביום העסקים הבא.
        </p>
      </Section>

      <Section title="תלונות">
        <p>
          אם משהו בשירות לא היה כשורה, כתבו לנו ל-{detail(BUSINESS.email)} ונטפל בזה.
          אם לא נמצא פתרון, עומדת לך הזכות לפנות לרשות להגנת הצרכן ולסחר הוגן.
        </p>
      </Section>
    </LegalPage>
  );
}
