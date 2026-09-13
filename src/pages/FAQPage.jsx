import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import EmptyState from '@/components/ui/EmptyState';
import Seo from '@/components/Seo';
import HowItWorksNotice from '@/components/HowItWorksNotice';
import CollectionHero from '@/components/catalog/CollectionHero';
import Breadcrumb from '@/components/shop/Breadcrumb';
import Disclosure from '@/components/shop/Disclosure';

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setFaqs(await base44.entities.FAQ.filter({ active: true }, 'sort_order', 50));
      } catch { /* the how-it-works answer below still shows */ }
      finally {
        setLoading(false);
      }
    })();
  }, []);

  // Mirrors the HowItWorksNotice block so the no-payment-on-site answer is the
  // one search engines surface too; it is always present, unlike the DB rows.
  const howItWorksEntry = {
    "@type": "Question",
    name: "איך מזמינים? האם משלמים באתר?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "באתר לא מתבצע תשלום. שליחת ההזמנה היא בקשה בלבד - אנחנו חוזרים אליך בוואטסאפ או באינסטגרם לאישור כל הפרטים, והתשלום מתבצע מולנו ישירות רק אחרי שסיכמנו."
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
    <div>
      <Seo title="שאלות ותשובות - JerseyLab" description="שאלות ותשובות נפוצות על רכישת חולצות כדורגל ב-JerseyLab: משלוחים, מידות, זמינות ופרטי הזמנה." canonicalPath="/faq" jsonLd={faqJsonLd} />

      <CollectionHero
        breadcrumb={<Breadcrumb trail={[{ label: 'שאלות ותשובות' }]} />}
        title="שאלות ותשובות"
        description="כל מה שצריך לדעת לפני שמזמינים: משלוחים, מידות, זמינות ואיך ההזמנה עובדת."
      />

      <div className="shop-container">
        <div className="mx-auto mt-8 max-w-3xl space-y-8">
          {/* How ordering works - hard-coded rather than a DB row, because a
              customer must never be able to reach this page without it. */}
          <HowItWorksNotice variant="full" />

          {loading ? (
            <div className="space-y-2.5" aria-busy="true">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[3.75rem] rounded-2xl skeleton" />)}
            </div>
          ) : faqs.length === 0 ? (
            <EmptyState
              compact
              icon={HelpCircle}
              title="אין שאלות ותשובות כרגע"
              description="יש לכם שאלה? כתבו לנו ונשמח לעזור."
            />
          ) : (
            <div className="space-y-2.5">
              {faqs.map(f => (
                <Disclosure key={f.id} title={f.question}>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-brand-navy/75">{f.answer}</p>
                </Disclosure>
              ))}
            </div>
          )}

          <div className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-brand-navy p-7 text-white sm:flex-row sm:items-center sm:p-9">
            <div>
              <p className="text-xl font-semibold">לא מצאתם תשובה?</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-white/70">כתבו לנו ונחזור אליכם מהר.</p>
            </div>
            <Link to="/contact" className="shop-btn flex-shrink-0">צרו קשר</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
