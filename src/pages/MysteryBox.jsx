import React from 'react';
import Seo from '@/components/Seo';
import HowItWorksNotice from '@/components/HowItWorksNotice';
import MysteryBoxInfo from '@/components/MysteryBoxInfo';
import MysteryBoxConfigurator from '@/components/MysteryBoxConfigurator';
import CollectionHero from '@/components/catalog/CollectionHero';
import Breadcrumb from '@/components/shop/Breadcrumb';

export default function MysteryBox() {
  return (
    <div>
      <Seo
        title="מיסטרי בוקס - JerseyLab"
        description="מיסטרי בוקס של JerseyLab: חולצת כדורגל מפתיעה לפי סגנון ומידה שתבחר. רגיל ₪70, רטרו ₪90, מונדיאל ₪70. אפשר לסמן קבוצות וצבעים שלא תרצה לקבל."
        canonicalPath="/mystery-box"
      />

      <CollectionHero
        breadcrumb={<Breadcrumb trail={[{ label: 'מיסטרי בוקס' }]} />}
        title="מיסטרי בוקס"
        description="אתם בוחרים סגנון ומידה, אנחנו בוחרים את החולצה. אותה איכות כמו בקטלוג, במחיר נמוך יותר."
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
