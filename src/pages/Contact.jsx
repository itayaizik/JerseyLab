import React, { useState, useEffect } from 'react';
import { MessageCircle, Check, Loader2, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { friendlyError } from '@/lib/errorMessages';
import Seo from '@/components/Seo';

const InstagramIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');

  useEffect(() => {
    base44.entities.SiteSetting.filter({ key: 'whatsapp_link' }).then(items => {
      if (items[0]) setWhatsappLink(items[0].value);
    }).catch(() => {});
  }, []);

  const contactLinks = [
    {
      href: whatsappLink || '#',
      icon: <MessageCircle className="w-5 h-5" />,
      label: 'WhatsApp',
      sub: 'הדרך הכי מהירה לפנות אלינו',
      bg: 'bg-green-500',
      border: 'hover:border-green-500',
    },
    {
      href: 'https://instagram.com/Jerseylabil',
      icon: <InstagramIcon />,
      label: 'Instagram',
      sub: '@Jerseylabil',
      bg: 'bg-gradient-to-br from-purple-500 to-pink-500',
      border: 'hover:border-pink-400',
    },
  ];

  const handleChange = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: undefined }));
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

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
      base44.analytics.track({ eventName: 'contact_submitted' });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(friendlyError(err, 'שליחת ההודעה נכשלה. נסה שוב בעוד רגע.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-[#E8622A] flex items-center justify-center mx-auto mb-5"
          style={{ border: '2px solid #1B2A4A', boxShadow: '4px 4px 0 #1B2A4A' }}>
          <Check className="w-8 h-8 text-white" />
        </div>
        <h2 className="font-heading font-black text-2xl text-[#1B2A4A] uppercase mb-2">ההודעה נשלחה!</h2>
        <p className="text-[#1B2A4A]/60 text-sm font-body">נחזור אליך בהקדם האפשרי.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Seo title="צור קשר — JerseyLab" description="צור קשר עם JerseyLab לשאלות, הזמנות ויעוץ בוואטסאפ ואינסטגרם. מענה מהיר ושירות אישי." canonicalPath="/contact" jsonLd={{ "@context": "https://schema.org", "@type": "WebPage", name: "צור קשר — JerseyLab", description: "צור קשר עם JerseyLab לשאלות, הזמנות ויעוץ.", url: (typeof window !== "undefined" ? window.location.origin : "https://jerseylabil.base44.app") + "/contact", inLanguage: "he-IL" }} />

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-block mb-3">
          <div className="bg-[#FFD95A]/60 px-4 py-1 text-xs font-heading tracking-widest text-[#1B2A4A] uppercase"
            style={{ transform: 'rotate(-1deg)' }}>
            דברו איתנו
          </div>
        </div>
        <h1 className="font-heading font-black text-4xl text-[#1B2A4A] uppercase mb-2" style={{ textShadow: '2px 2px 6px rgba(27,42,74,0.15)' }}>צור קשר</h1>
        <p className="text-[#1B2A4A]/60 font-body text-sm">שלח הודעה או פנה אלינו ישירות</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Left — contact channels */}
        <div className="space-y-4">
          <p className="font-heading font-bold text-xs uppercase tracking-widest text-[#1B2A4A]/50 mb-4">פנה אלינו ישירות</p>

          {contactLinks.map(link => (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-4 p-4 bg-white border-2 border-[#1B2A4A] ${link.border} hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group`}
              style={{ boxShadow: '3px 3px 0 #1B2A4A' }}>
              <div className={`w-11 h-11 ${link.bg} text-white flex items-center justify-center flex-shrink-0`}
                style={{ border: '2px solid #1B2A4A' }}>
                {link.icon}
              </div>
              <div>
                <p className="font-heading font-bold text-sm text-[#1B2A4A] uppercase">{link.label}</p>
                <p className="text-xs text-[#1B2A4A]/60 font-body">{link.sub}</p>
              </div>
              <span className="mr-auto text-[#E8622A] font-heading font-bold text-xs uppercase opacity-0 group-hover:opacity-100 transition-opacity">פנה ←</span>
            </a>
          ))}

          {/* Info box */}
          <div className="bg-[#1B2A4A] text-white p-5 mt-6" style={{ border: '2px solid #1B2A4A', boxShadow: '3px 3px 0 #E8622A' }}>
            <p className="font-heading font-bold text-xs uppercase tracking-widest text-[#E8622A] mb-3">שעות פעילות</p>
            <p className="font-body text-sm text-white/80 leading-relaxed">
              ימים א׳–ה׳: 9:00–21:00<br />
              שישי: 9:00–14:00<br />
              שבת: סגור
            </p>
          </div>
        </div>

        {/* Right — form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 space-y-4"
          style={{ border: '2px solid #1B2A4A', boxShadow: '4px 4px 0 #1B2A4A' }}>
          <p className="font-heading font-bold text-xs uppercase tracking-widest text-[#1B2A4A]/50 mb-2">שלח הודעה</p>

          <div>
            <label htmlFor="contact-name" className="text-xs font-heading font-bold text-[#1B2A4A] uppercase block mb-1">שם מלא *</label>
            <input id="contact-name" value={form.name} onChange={e => handleChange('name', e.target.value)} maxLength={100} autoComplete="name"
              className={`w-full border-2 px-3 py-2.5 text-sm bg-white focus:outline-none ${errors.name ? 'border-red-500' : 'border-[#1B2A4A]'}`} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="contact-email" className="text-xs font-heading font-bold text-[#1B2A4A] uppercase block mb-1">אימייל *</label>
            <input id="contact-email" value={form.email} onChange={e => handleChange('email', e.target.value)} type="email" dir="ltr" maxLength={254} autoComplete="email"
              className={`w-full border-2 px-3 py-2.5 text-sm bg-white focus:outline-none ${errors.email ? 'border-red-500' : 'border-[#1B2A4A]'}`} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="contact-phone" className="text-xs font-heading font-bold text-[#1B2A4A] uppercase block mb-1">טלפון</label>
              <input id="contact-phone" value={form.phone} onChange={e => handleChange('phone', e.target.value)} dir="ltr" maxLength={20} autoComplete="tel"
                className="w-full border-2 border-[#1B2A4A] px-3 py-2.5 text-sm bg-white focus:outline-none" />
            </div>
            <div>
              <label htmlFor="contact-subject" className="text-xs font-heading font-bold text-[#1B2A4A] uppercase block mb-1">נושא</label>
              <input id="contact-subject" value={form.subject} onChange={e => handleChange('subject', e.target.value)} maxLength={200}
                className="w-full border-2 border-[#1B2A4A] px-3 py-2.5 text-sm bg-white focus:outline-none" />
            </div>
          </div>

          <div>
            <label htmlFor="contact-message" className="text-xs font-heading font-bold text-[#1B2A4A] uppercase block mb-1">הודעה *</label>
            <textarea id="contact-message" value={form.message} onChange={e => handleChange('message', e.target.value)} maxLength={2000}
              rows={5} className={`w-full border-2 px-3 py-2.5 text-sm bg-white focus:outline-none resize-none font-body ${errors.message ? 'border-red-500' : 'border-[#1B2A4A]'}`} />
            {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 border-2 border-red-300 text-red-700 text-sm font-body">
              {submitError}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-[#E8622A] text-white py-3 font-heading font-bold text-sm uppercase tracking-wider hover:bg-[#D0551F] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ boxShadow: '3px 3px 0 #1B2A4A', textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {submitting ? 'שולח...' : 'שלח הודעה'}
          </button>
        </form>
      </div>
    </div>
  );
}