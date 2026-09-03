import React from 'react';
import { Gift } from 'lucide-react';
import Seo from '@/components/Seo';
import HowItWorksNotice from '@/components/HowItWorksNotice';
import MysteryBoxInfo from '@/components/MysteryBoxInfo';
import MysteryBoxConfigurator from '@/components/MysteryBoxConfigurator';

export default function MysteryBox() {
  return (
    <div className="bg-[#F2ECD9] min-h-screen">
      <Seo
        title="מיסטרי בוקס - JerseyLab"
        description="מיסטרי בוקס של JerseyLab: חולצת כדורגל מפתיעה לפי סגנון ומידה שתבחר. רגיל ₪70, רטרו ₪90, מונדיאל ₪70. אפשר לסמן קבוצות וצבעים שלא תרצה לקבל."
        canonicalPath="/mystery-box"
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-[#1B2A4A]" style={{ background: '#1B2A4A' }}>
        <div className="absolute inset-0 opacity-[0.12]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />
        <div className="relative max-w-6xl mx-auto px-4 py-9 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-3 bg-[#E8622A]"
            style={{ boxShadow: '4px 4px 0 #FFD95A' }}>
            <Gift className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-black text-4xl md:text-5xl text-white uppercase mb-2">
            מיסטרי בוקס
          </h1>
          <p className="font-body text-white/75 text-sm md:text-base max-w-xl mx-auto">
            אתה בוחר סגנון ומידה - אנחנו בוחרים את החולצה.
          </p>
        </div>
      </section>

      {/* The configurator is the page. It gets the wider column and the top of
          the reading order; the write-up sits beside it as support, because
          the previous split gave the explanations twice the room and the box
          itself read like a sidebar. */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] gap-6 items-start">
          <MysteryBoxConfigurator idPrefix="mb-page" size="lg" />

          <aside className="space-y-4 lg:sticky lg:top-24">
            <MysteryBoxInfo compact />
            <HowItWorksNotice variant="full" />
          </aside>
        </div>
      </div>
    </div>
  );
}
