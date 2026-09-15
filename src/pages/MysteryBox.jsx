import React from 'react';
import Seo from '@/components/Seo';
import HowItWorksNotice from '@/components/HowItWorksNotice';
import MysteryBoxInfo from '@/components/MysteryBoxInfo';
import MysteryBoxConfigurator from '@/components/MysteryBoxConfigurator';
import CollectionHero from '@/components/catalog/CollectionHero';
import Breadcrumb from '@/components/shop/Breadcrumb';
import { t } from '@/lib/i18n';

export default function MysteryBox() {
  return (
    <div>
      <Seo
        title={t('מיסטרי בוקס - JerseyLab', 'Mystery Box - JerseyLab')}
        description={t(
          'מיסטרי בוקס של JerseyLab: חולצת כדורגל מפתיעה לפי סגנון ומידה שתבחר. רגיל ₪70, רטרו ₪80, מונדיאל ₪70. אפשר לסמן קבוצות וצבעים שלא תרצה לקבל.',
          "JerseyLab's Mystery Box: a surprise football shirt in the style and size you choose. Regular ₪70, retro ₪80, World Cup ₪70. Rule out teams and colours you don't want.",
        )}
        canonicalPath="/mystery-box"
      />

      <CollectionHero
        breadcrumb={<Breadcrumb trail={[{ label: t('מיסטרי בוקס', 'Mystery Box') }]} />}
        title={t('מיסטרי בוקס', 'Mystery Box')}
        description={t('אתם בוחרים סגנון ומידה, והחולצה יוצאת אקראית. אותה איכות ואותו מחיר כמו בקטלוג, רק בהפתעה.', 'You choose the style and size, and the shirt comes out at random. The same quality and price as the catalog, just as a surprise.')}
      />

      {/* The configurator is the page. It gets the wider column and the top of
          the reading order; the write-up sits beside it as support. */}
      <div className="shop-container">
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-8">
          <MysteryBoxConfigurator idPrefix="mb-page" size="lg" />

          <aside className="space-y-4 lg:sticky lg:top-28">
            <div className="shop-card p-6">
              <MysteryBoxInfo compact />
            </div>
            <HowItWorksNotice variant="full" />
          </aside>
        </div>
      </div>
    </div>
  );
}
