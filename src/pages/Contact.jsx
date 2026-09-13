import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Check, Loader2, Mail, Instagram, Clock, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { friendlyError } from '@/lib/errorMessages';
import { notifyNewEnquiry } from '@/lib/adminNotify';
import Seo from '@/components/Seo';
import { SITE_ORIGIN } from '@/lib/siteUrl';
import PrivacyConsent from '@/components/PrivacyConsent';
import Honeypot, { isBot } from '@/components/ui/Honeypot';
import CollectionHero from '@/components/catalog/CollectionHero';
import Breadcrumb from '@/components/shop/Breadcrumb';
import FormField, { fieldClass } from '@/components/shop/FormField';
import { SHOP_PHONE, WHATSAPP_URL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/contact';

const HOURS = [
  { day: 'ימים א׳–ה׳', time: '9:00–21:00' },
  { day: 'שישי', time: '9:00–14:00' },
  { day: 'שבת', time: 'סגור' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [privacyOk, setPrivacyOk] = useState(false);
  const [trap, setTrap] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');

  useEffect(() => {
    base44.entities.SiteSetting.filter({ key: 'whatsapp_link' }).then(items => {
      if (items[0]) setWhatsappLink(items[0].value);
    }).catch(() => {});
  }, []);

  const channels = [
    { href: whatsappLink || WHATSAPP_URL, icon: MessageCircle, label: 'וואטסאפ', sub: 'הדרך הכי מהירה לפנות אלינו', value: SHOP_PHONE },
    { href: INSTAGRAM_URL, icon: Instagram, label: 'אינסטגרם', sub: 'שלחו לנו הודעה', value: `@${INSTAGRAM_HANDLE}` },
  ];

  const handleChange = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: undefined }));
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'שדה חובה';
    if (form.name.length > 100) errs.name = 'שם ארוך מדי (מקסימום 100 תווים)';
    if (!form.email.trim() || !validateEmail(form.email)) errs.email = 'נא להזין כתובת אימייל תקינה';
    if (form.email.length > 254) errs.email = 'כתובת אימייל ארוכה מדי';
    if (form.phone.length > 20) errs.phone = 'מספר טלפון ארוך מדי (מקסימום 20 תווים)';
    if (form.subject.length > 200) errs.subject = 'נושא ארוך מדי (מקסימום 200 תווים)';
    if (!form.message.trim()) errs.message = 'שדה חובה';
    if (form.message.length > 2000) errs.message = 'הודעה ארוכה מדי (מקסימום 2000 תווים)';
    if (!privacyOk) errs.privacy = 'יש לאשר את מדיניות הפרטיות';
    // Silently accepted and dropped: telling a bot it was detected only helps
    // whoever wrote it.
    if (isBot(trap)) { setSubmitted(true); return; }
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      await base44.entities.ContactMessage.create({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        status: 'new',
      });
      notifyNewEnquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        subject: form.subject,
        message: form.message.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(friendlyError(err, 'שליחת ההודעה נכשלה. נסו שוב בעוד רגע.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="shop-container py-16">
        <div className="mx-auto max-w-lg rounded-[2rem] bg-brand-mist px-6 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-card">
            <Check className="h-8 w-8 text-emerald-600" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-brand-navy">ההודעה נשלחה</h1>
          <p className="mt-2 text-[15px] text-brand-navy/60">נחזור אליכם בהקדם האפשרי.</p>
          <Link to="/catalog" className="shop-btn mt-6">בינתיים, לחולצות</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Seo title="צור קשר - JerseyLab" description="צור קשר עם JerseyLab לשאלות, הזמנות ויעוץ בוואטסאפ ואינסטגרם. מענה מהיר ושירות אישי." canonicalPath="/contact" jsonLd={{ "@context": "https://schema.org", "@type": "WebPage", name: "צור קשר - JerseyLab", description: "צור קשר עם JerseyLab לשאלות, הזמנות ויעוץ.", url: (SITE_ORIGIN) + "/contact", inLanguage: "he-IL" }} />

      <CollectionHero
        breadcrumb={<Breadcrumb trail={[{ label: 'צור קשר' }]} />}
        title="צור קשר"
        description="שאלה על מידה, זמינות או הזמנה מיוחדת? הכי מהיר בוואטסאפ, ואפשר גם להשאיר הודעה כאן."
      />

      <div className="shop-container">
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-8">
          <div className="space-y-3">
            {channels.map(({ href, icon: Icon, label, sub, value }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-3xl bg-white p-5 shadow-card transition-shadow hover:shadow-lift">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-orange-soft text-brand-orange-ink">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-brand-navy">{label}</span>
                  <span className="block text-[13px] text-brand-navy/55">{sub}</span>
                  <span dir="ltr" className="mt-0.5 block text-right text-sm font-medium text-brand-navy/80">{value}</span>
                </span>
                <ArrowLeft className="h-5 w-5 flex-shrink-0 text-brand-navy/30 transition group-hover:-translate-x-1 group-hover:text-brand-orange-ink" aria-hidden="true" />
              </a>
            ))}

            <div className="rounded-3xl bg-brand-navy p-6 text-white">
              <p className="flex items-center gap-2 text-sm font-semibold text-brand-gold">
                <Clock className="h-4 w-4" aria-hidden="true" />
                שעות פעילות
              </p>
              <dl className="mt-4 space-y-2 text-[15px]">
                {HOURS.map(row => (
                  <div key={row.day} className="flex items-center justify-between gap-4 border-b border-white/10 pb-2 last:border-b-0 last:pb-0">
                    <dt className="text-white/70">{row.day}</dt>
                    <dd dir="ltr" className="font-semibold tabular-nums">{row.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="shop-card space-y-4 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-brand-navy">שליחת הודעה</h2>

            <FormField id="contact-name" label="שם מלא" required error={errors.name}>
              <input id="contact-name" value={form.name} onChange={e => handleChange('name', e.target.value)} maxLength={100} autoComplete="name"
                aria-invalid={!!errors.name} className={fieldClass(errors.name)} />
            </FormField>

            <FormField id="contact-email" label="אימייל" required error={errors.email}>
              <input id="contact-email" value={form.email} onChange={e => handleChange('email', e.target.value)} type="email" dir="ltr" maxLength={254} autoComplete="email"
                aria-invalid={!!errors.email} className={`${fieldClass(errors.email)} text-right`} />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="contact-phone" label="טלפון" optional error={errors.phone}>
                <input id="contact-phone" value={form.phone} onChange={e => handleChange('phone', e.target.value)} type="tel" dir="ltr" maxLength={20} autoComplete="tel"
                  className={`${fieldClass(errors.phone)} text-right`} />
              </FormField>
              <FormField id="contact-subject" label="נושא" optional error={errors.subject}>
                <input id="contact-subject" value={form.subject} onChange={e => handleChange('subject', e.target.value)} maxLength={200}
                  className={fieldClass(errors.subject)} />
              </FormField>
            </div>

            <FormField id="contact-message" label="הודעה" required error={errors.message}>
              <textarea id="contact-message" value={form.message} onChange={e => handleChange('message', e.target.value)} maxLength={2000}
                rows={5} aria-invalid={!!errors.message} className={`${fieldClass(errors.message)} resize-none py-3`} />
            </FormField>

            {submitError && (
              <div role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{submitError}</div>
            )}

            <Honeypot value={trap} onChange={setTrap} />

            <PrivacyConsent id="contact-privacy" checked={privacyOk} onChange={setPrivacyOk} error={errors.privacy} />

            <button type="submit" disabled={submitting} className="shop-btn w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {submitting ? 'שולח...' : 'שליחת ההודעה'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
