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
      description="פרטי העסק המלאים של JerseyLab: שם, מספר עוסק, כתובת ודרכי יצירת קשר, כנדרש בחוק הגנת הצרכן."
      intro="הפרטים המלאים של מי שעומד מאחורי האתר, כנדרש בחוק הגנת הצרכן לעסקת מכר מרחוק."
    >
      <Section title="זהות העסק">
        <dl>
          <Fact label="שם מסחרי" value={BUSINESS.tradingName} />
          <Fact label="שם בעל העסק" value={BUSINESS.legalName} />
          <Fact label="סוג רישום" value={BUSINESS.registrationType} />
          <Fact label="מספר עוסק / ח.פ." value={BUSINESS.registrationNumber} />
          <Fact label="כתובת" value={BUSINESS.address} />
        </dl>
      </Section>

      <Section title="יצירת קשר">
        <dl>
          <Fact label="טלפון ווואטסאפ" value={BUSINESS.phone} />
          <Fact label="דוא״ל" value={BUSINESS.email} />
          <Fact label="אינסטגרם" value={`@${BUSINESS.instagram}`} />
        </dl>
        <div className="flex flex-wrap gap-2 mt-4">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center min-h-[44px] px-4 bg-[#1B2A4A] text-white font-heading font-bold text-sm uppercase tracking-wide hover:bg-[#E8622A] transition-colors">
            וואטסאפ
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center min-h-[44px] px-4 border-2 border-[#1B2A4A] text-[#1B2A4A] font-heading font-bold text-sm uppercase tracking-wide hover:bg-[#F2ECD9] transition-colors">
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
