import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Upload, X, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import Seo from '@/components/Seo';
import ContactChannelChoice from '@/components/configurator/ContactChannelChoice';
import HowItWorksNotice from '@/components/HowItWorksNotice';
import { friendlyError } from '@/lib/errorMessages';
import { notifyShirtRequest } from '@/lib/adminNotify';
import { SIZE_ORDER } from '@/lib/sizes';

// "I want a shirt you don't stock." The catalogue can never hold every kit
// ever made, so this is the way in for everything it doesn't: the customer
// describes the shirt, optionally attaches a photo of it, and we answer
// whether we can source it and for how much.
//
// Deliberately open to logged-out visitors — requiring an account here would
// lose exactly the customers this page exists to capture.

// Same contact details the cart remembers, so someone who has ordered before
// is not retyping them. Written by InterestModal; only read here.
const CONTACT_KEY = 'jerseylab_contact';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function RequestShirt() {
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', contact_channel: '', instagram_handle: '',
    shirt_description: '', club: '', season: '', wanted_size: '', notes: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [user, setUser] = useState(null);
  const fileInputRef = useRef(null);

  // Prefill from the account first, then from whatever the cart remembered.
  // Failing to load a user is the normal logged-out path, not an error.
  useEffect(() => {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(CONTACT_KEY) || '{}'); } catch { /* private mode */ }

    (async () => {
      let me = null;
      try { me = await base44.auth.me(); setUser(me); } catch { /* not logged in */ }
      setForm(prev => ({
        ...prev,
        full_name: me?.full_name || saved.full_name || prev.full_name,
        email: me?.email || saved.email || prev.email,
        phone: saved.phone || prev.phone,
        contact_channel: saved.contact_channel || prev.contact_channel,
        instagram_handle: saved.instagram_handle || prev.instagram_handle,
      }));
    })();
  }, []);

  // The object URL behind the preview is revoked when the picture is replaced
  // or the page unmounts; without this every re-pick leaks a blob for the life
  // of the tab.
  useEffect(() => {
    if (!image) { setImagePreview(''); return; }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const setField = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: undefined }));
  };

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors(p => ({ ...p, image: 'אפשר להעלות תמונה בלבד' }));
      return;
    }
    // Checked here rather than after upload: the storage bucket rejects an
    // oversized file with an opaque error the customer cannot act on.
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors(p => ({ ...p, image: 'התמונה גדולה מדי (מקסימום 8MB)' }));
      return;
    }
    setErrors(p => ({ ...p, image: undefined }));
    setImage(file);
  };

  const clearImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'שדה חובה';
    if (!form.phone.trim()) errs.phone = 'שדה חובה';
    if (!form.email.trim()) errs.email = 'שדה חובה';
    else if (!isValidEmail(form.email.trim())) errs.email = 'נא להזין כתובת אימייל תקינה';
    if (!form.contact_channel) errs.contact_channel = 'בחר איך נחזור אליך';
    if (form.contact_channel === 'instagram' && !form.instagram_handle.trim()) {
      errs.instagram_handle = 'שדה חובה';
    }
    // A photo on its own is a valid request — plenty of people have the picture
    // but not the words — so a description is only required when there is none.
    if (!form.shirt_description.trim() && !image) {
      errs.shirt_description = 'תאר את החולצה או צרף תמונה';
    }
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setErrors({});
    setSubmitError('');

    try {
      // Uploaded before the row is written: if storage fails we want to fail
      // outright, not save a request that promises a photo the admin panel
      // will never be able to show.
      let image_url = '';
      if (image) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: image, bucket: 'request-images' });
        image_url = file_url;
      }

      const igHandle = form.instagram_handle.trim().replace(/^@/, '');
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        contact_channel: form.contact_channel,
        instagram_handle: form.contact_channel === 'instagram' ? igHandle : '',
        shirt_description: form.shirt_description.trim(),
        club: form.club.trim(),
        season: form.season.trim(),
        wanted_size: form.wanted_size,
        notes: form.notes.trim(),
        image_url,
        status: 'new',
        user_id: user?.id || '',
      };

      await base44.entities.ShirtRequest.create(payload);

      // Best-effort, exactly like the order mail: the request is already saved,
      // so a mail outage must not read to the customer as a failed submission.
      notifyShirtRequest(payload);

      setSubmitted(true);
    } catch (err) {
      setSubmitError(friendlyError(err, 'שליחת הבקשה נכשלה. נסה שוב בעוד רגע.'));
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
        <h2 className="font-heading font-black text-2xl text-[#1B2A4A] uppercase mb-2">הבקשה נשלחה!</h2>
        <p className="text-[#1B2A4A]/60 text-sm font-body mb-6">
          נבדוק אם אפשר להשיג את החולצה ונחזור אליך
          ב{form.contact_channel === 'instagram' ? 'אינסטגרם' : 'וואטסאפ'} עם תשובה ומחיר.
        </p>
        <Link to="/catalog"
          className="inline-block bg-[#1B2A4A] text-white px-6 py-3 font-heading font-bold text-sm uppercase tracking-wider hover:bg-[#E8622A] transition-colors"
          style={{ boxShadow: '3px 3px 0 #E8622A' }}>
          בינתיים — לקטלוג
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F2ECD9] min-h-screen">
      <Seo
        title="מחפשים חולצה שאין באתר? — JerseyLab"
        description="לא מצאתם את החולצה בקטלוג? שלחו לנו בקשה עם תמונה או תיאור, ונבדוק אם אפשר להשיג אותה ובאיזה מחיר."
        canonicalPath="/request-shirt"
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-[#1B2A4A]" style={{ background: '#1B2A4A' }}>
        <div className="absolute inset-0 opacity-[0.12]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />
        <div className="relative max-w-2xl mx-auto px-4 py-9 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-3 bg-[#E8622A]"
            style={{ boxShadow: '4px 4px 0 #FFD95A' }}>
            <Search className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-black text-3xl md:text-4xl text-white uppercase mb-2">
            מחפשים חולצה שאין באתר?
          </h1>
          <p className="font-body text-white/75 text-sm md:text-base max-w-lg mx-auto">
            הקטלוג הוא לא הכל. שלחו לנו תמונה או תיאור של החולצה שאתם מחפשים —
            נבדוק אם אפשר להשיג אותה ונחזור אליכם עם תשובה ומחיר.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white border-2 border-[#1B2A4A] p-5 space-y-6"
          style={{ boxShadow: '5px 5px 0 #1B2A4A' }}>

          {/* ── What they are after ── */}
          <Section number={1} title="איזו חולצה?">
            <Field label="תיאור החולצה" htmlFor="rs-desc" error={errors.shirt_description}>
              <textarea id="rs-desc" value={form.shirt_description} rows={3} maxLength={600}
                onChange={e => setField('shirt_description', e.target.value)}
                placeholder="למשל: חולצת בית של אינטר 2009/10, עם השם של מיליטו מאחורה"
                className={inputClass(errors.shirt_description) + ' resize-none'} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="קבוצה / נבחרת" htmlFor="rs-club">
                <input id="rs-club" value={form.club} maxLength={100}
                  onChange={e => setField('club', e.target.value)}
                  placeholder="אינטר מילאן" className={inputClass()} />
              </Field>
              <Field label="עונה" htmlFor="rs-season">
                <input id="rs-season" value={form.season} maxLength={40} dir="ltr"
                  onChange={e => setField('season', e.target.value)}
                  placeholder="2009/10" className={inputClass()} />
              </Field>
            </div>

            <Field label="מידה" htmlFor="rs-size">
              <select id="rs-size" value={form.wanted_size} onChange={e => setField('wanted_size', e.target.value)}
                className={inputClass() + ' bg-white'}>
                <option value="">עדיין לא יודע</option>
                {SIZE_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            {/* The photo. Easily the most useful field on this form — a picture
                identifies a kit far faster than any description of it. */}
            <div>
              <p className="text-xs font-heading font-bold text-[#1B2A4A]/60 uppercase block mb-1.5">
                תמונה של החולצה
              </p>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="התמונה שצירפת" className="w-32 h-32 object-cover border-2 border-[#1B2A4A]" />
                  <button type="button" onClick={clearImage} aria-label="הסר תמונה"
                    className="absolute -top-2 -left-2 w-7 h-7 flex items-center justify-center bg-white border-2 border-[#1B2A4A] text-[#1B2A4A] hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#1B2A4A]/40 hover:border-[#1B2A4A] hover:bg-[#F2ECD9]/60 transition-colors py-6 cursor-pointer">
                  <ImageIcon className="w-7 h-7 text-[#1B2A4A]/40" />
                  <span className="text-sm font-body text-[#1B2A4A]/70 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    צרף תמונה
                  </span>
                  <span className="text-[11px] font-body text-[#1B2A4A]/40">צילום מסך מאינסטגרם או מגוגל עובד מצוין</span>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
                </label>
              )}
              {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
            </div>
          </Section>

          {/* ── How to reach them ── */}
          <Section number={2} title="איך נחזור אליך?">
            <Field label="שם מלא *" htmlFor="rs-name" error={errors.full_name}>
              <input id="rs-name" value={form.full_name} maxLength={100} autoComplete="name"
                onChange={e => setField('full_name', e.target.value)} className={inputClass(errors.full_name)} />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="טלפון *" htmlFor="rs-phone" error={errors.phone}>
                <input id="rs-phone" value={form.phone} type="tel" dir="ltr" maxLength={20} autoComplete="tel"
                  onChange={e => setField('phone', e.target.value)} className={inputClass(errors.phone)} />
              </Field>
              <Field label="אימייל *" htmlFor="rs-email" error={errors.email}>
                <input id="rs-email" value={form.email} type="email" dir="ltr" maxLength={254} autoComplete="email"
                  onChange={e => setField('email', e.target.value)} className={inputClass(errors.email)} />
              </Field>
            </div>

            <ContactChannelChoice
              value={form.contact_channel}
              onChange={v => setField('contact_channel', v)}
              error={errors.contact_channel}
            />

            {form.contact_channel === 'instagram' && (
              <Field label="שם משתמש באינסטגרם *" htmlFor="rs-ig" error={errors.instagram_handle}>
                <input id="rs-ig" value={form.instagram_handle} dir="ltr" maxLength={60} placeholder="@username"
                  onChange={e => setField('instagram_handle', e.target.value)} className={inputClass(errors.instagram_handle)} />
              </Field>
            )}

            <Field label="משהו נוסף שכדאי שנדע?" htmlFor="rs-notes">
              <textarea id="rs-notes" value={form.notes} rows={2} maxLength={500}
                onChange={e => setField('notes', e.target.value)}
                placeholder="תקציב, עד מתי אתה צריך אותה, גרסת שחקן או אוהד…"
                className={inputClass() + ' resize-none'} />
            </Field>
          </Section>

          <HowItWorksNotice />

          {submitError && <p className="text-red-600 text-sm font-body">{submitError}</p>}

          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-[#E8622A] text-white py-4 font-heading font-bold text-base uppercase tracking-wider hover:bg-[#D0551F] disabled:opacity-60 transition-colors"
            style={{ boxShadow: '3px 3px 0 #1B2A4A' }}>
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {submitting ? 'שולח…' : 'שלח בקשה'}
          </button>
          <p className="text-[11px] text-center text-[#1B2A4A]/50 font-body">
            בלי התחייבות ובלי תשלום — בקשה בלבד.
          </p>
        </form>
      </div>
    </div>
  );
}

// Shared input styling. The error state only swaps the border colour, so it
// lives here instead of being repeated on every field.
function inputClass(error) {
  return `w-full border-2 px-3 py-2.5 text-sm bg-white focus:outline-none font-body ${error ? 'border-red-500' : 'border-[#1B2A4A]'}`;
}

function Section({ number, title, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 flex-shrink-0 bg-[#1B2A4A] text-white font-mono font-bold text-xs flex items-center justify-center">
          {number}
        </span>
        <h2 className="font-heading font-bold text-sm text-[#1B2A4A] uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, htmlFor, error, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-xs font-heading font-bold text-[#1B2A4A]/60 uppercase block mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
