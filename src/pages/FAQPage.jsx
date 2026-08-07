import React, { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import EmptyState from '@/components/ui/EmptyState';
import Seo from '@/components/Seo';
import HowItWorksNotice from '@/components/HowItWorksNotice';

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await base44.entities.FAQ.filter({ active: true }, 'sort_order', 50);
      setFaqs(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#1B2A4A]/20 border-t-[#E8622A] rounded-full animate-spin" />
      </div>
    );
  }

  // Mirrors the HowItWorksNotice block so the no-payment-on-site answer is the
  // one search engines surface too; it is always present, unlike the DB rows.
  const howItWorksEntry = {
    "@type": "Question",
    name: "איך מזמינים? האם משלמים באתר?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "באתר לא מתבצע תשלום. שליחת ההזמנה היא בקשה בלבד — אנחנו חוזרים אליך בוואטסאפ או באינסטגרם לאישור כל הפרטים, והתשלום מתבצע מולנו ישירות רק אחרי שסיכמנו."
    }
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      howItWorksEntry,
      ...faqs.map(f => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer }
      }))
    ]
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Seo title="שאלות ותשובות — JerseyLab" description="שאלות ותשובות נפוצות על רכישת חולצות כדורגל ב-JerseyLab: משלוחים, מידות, זמינות ופרטי הזמנה." canonicalPath="/faq" jsonLd={faqJsonLd} />

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-[#1B2A4A]"
          style={{ border: '2px solid #1B2A4A', boxShadow: '4px 4px 0 #E8622A' }}>
          <HelpCircle className="w-8 h-8 text-white" />
        </div>
        <div className="inline-block mb-3">
          <div className="bg-[#FFD95A]/60 px-4 py-1 text-xs font-heading tracking-widest text-[#1B2A4A] uppercase"
            style={{ transform: 'rotate(-1deg)' }}>
            יש לך שאלה?
          </div>
        </div>
        <h1 className="font-heading font-black text-4xl text-[#1B2A4A] uppercase mb-2" style={{ textShadow: '2px 2px 6px rgba(27,42,74,0.15)' }}>שאלות ותשובות</h1>
        <p className="text-[#1B2A4A]/60 font-body text-sm">כל מה שצריך לדעת לפני שפונים אלינו</p>
      </div>

      {/* How ordering works — hard-coded rather than a DB row, because a
          customer must never be able to reach this page without it. */}
      <div className="mb-8">
        <HowItWorksNotice variant="full" />
      </div>

      {/* FAQ List */}
      {faqs.length === 0 ? (
        <EmptyState
          compact
          icon={HelpCircle}
          title="אין שאלות ותשובות כרגע"
          description="יש לך שאלה? כתוב לנו למטה ונשמח לעזור."
        />
      ) : (
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = openId === f.id;
            return (
              <div key={f.id}
                className="bg-white border-2 border-[#1B2A4A] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ boxShadow: isOpen ? '4px 4px 0 #E8622A' : '3px 3px 0 #1B2A4A' }}>
                <button
                  onClick={() => setOpenId(isOpen ? null : f.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${f.id}`}
                  className="w-full flex items-center justify-between px-5 py-4 text-right gap-3 group">
                  <div className="flex items-center gap-3">
                    <span className="text-[#E8622A] font-mono font-bold text-xs flex-shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-heading font-bold text-sm text-[#1B2A4A] uppercase leading-snug text-right">
                      {f.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#E8622A] flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div id={`faq-answer-${f.id}`} role="region" aria-label={`תשובה: ${f.question}`} className="px-5 pb-5 pt-0 border-t-2 border-[#1B2A4A]">
                    <p className="text-sm text-[#1B2A4A]/70 leading-relaxed whitespace-pre-wrap font-body pt-4">
                      {f.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div className="mt-10 bg-[#1B2A4A] p-6 text-center"
        style={{ border: '2px solid #1B2A4A', boxShadow: '3px 3px 0 #E8622A' }}>
        <p className="text-white/80 text-sm font-body mb-3">לא מצאת תשובה לשאלתך?</p>
        <Link to="/contact"
          className="inline-block bg-[#E8622A] text-white font-heading font-bold text-sm px-6 py-2.5 uppercase tracking-wider hover:bg-[#D0551F] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
          style={{ boxShadow: '2px 2px 0 rgba(255,255,255,0.2)', textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>
          צור קשר
        </Link>
      </div>
    </div>
  );
}