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
import PrivacyConsent from '@/components/PrivacyConsent';
import Honeypot, { isBot } from '@/components/ui/Honeypot';
import CollectionHero from '@/components/catalog/CollectionHero';
import Breadcrumb from '@/components/shop/Breadcrumb';
import FormField, { fieldClass } from '@/components/shop/FormField';

// "I want a shirt you don't stock." The catalogue can never hold every kit
// ever made, so this is the way in for everything it doesn't: the customer
// describes the shirt, optionally attaches a photo of it, and we answer
// whether we can source it and for how much.
//
// Deliberately open to logged-out visitors - requiring an account here would
// lose exactly the customers this page exists to capture.

// Same contact details the cart remembers, so someone who has ordered before
// is not retyping them. Written by the cart drawer; only read here.
const CONTACT_KEY = 'jerseylab_contact';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function Section({ number, title, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-white">
          {number}
        </span>
        <h2 className="text-lg font-semibold text-brand-navy">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function RequestShirt() {
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', contact_channel: '', instagram_handle: '',
    shirt_description: '', club: '', season: '', wanted_size: '', notes: '',
  });
  const [privacyOk, setPrivacyOk] = useState(false);
  const [trap, setTrap] = useState('');
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
    if (!form.contact_channel) errs.contact_channel = 'בחרו איך נחזור אליכם';
    if (form.contact_channel === 'instagram' && !form.instagram_handle.trim()) {
      errs.instagram_handle = 'שדה חובה';
    }
    // A photo on its own is a valid request - plenty of people have the picture
    // but not the words - so a description is only required when there is none.
    if (!form.shirt_description.trim() && !image) {
      errs.shirt_description = 'תארו את החולצה או צרפו תמונה';
    }
    if (!privacyOk) errs.privacy = 'יש לאשר את מדיניות הפרטיות';
    if (isBot(trap)) { setSubmitted(true); return; }
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
      setSubmitError(friendlyError(err, 'שליחת הבקשה נכשלה. נסו שוב בעוד רגע.'));
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
          <h1 className="mt-5 text-2xl font-semibold text-brand-navy">הבקשה נשלחה</h1>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-brand-navy/60">
            נבדוק אם אפשר להשיג את החולצה ונחזור אליכם
            ב{form.contact_channel === 'instagram' ? 'אינסטגרם' : 'וואטסאפ'} עם תשובה ומחיר.
          </p>
          <Link to="/catalog" className="shop-btn mt-6">בינתיים, לחולצות</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Seo
        title="מחפשים חולצה שאין באתר? - JerseyLab"
        description="לא מצאתם את החולצה בקטלוג? שלחו לנו בקשה עם תמונה או תיאור, ונבדוק אם אפשר להשיג אותה ובאיזה מחיר."
        canonicalPath="/request-shirt"
      />

      <CollectionHero
        breadcrumb={<Breadcrumb trail={[{ label: 'בקשת חולצה' }]} />}
        title="מחפשים חולצה שאין באתר?"
        description="הקטלוג הוא לא הכל. שלחו לנו תמונה או תיאור של החולצה שאתם מחפשים, ונחזור אליכם עם תשובה ומחיר."
      />

      <div className="shop-container">
        <form onSubmit={handleSubmit} noValidate className="shop-card mx-auto mt-8 max-w-2xl space-y-8 p-6 sm:p-10">
          {/* ── What they are after ── */}
          <Section number={1} title="איזו חולצה?">
            <FormField id="rs-desc" label="תיאור החולצה" error={errors.shirt_description}>
              <textarea id="rs-desc" value={form.shirt_description} rows={3} maxLength={600}
                onChange={e => setField('shirt_description', e.target.value)}
                placeholder="למשל: חולצת בית של אינטר 2009/10, עם השם של מיליטו מאחורה"
                className={`${fieldClass(errors.shirt_description)} resize-none py-3`} />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField id="rs-club" label="קבוצה / נבחרת">
                <input id="rs-club" value={form.club} maxLength={100}
                  onChange={e => setField('club', e.target.value)}
                  placeholder="אינטר מילאן" className={fieldClass()} />
              </FormField>
              <FormField id="rs-season" label="עונה">
                <input id="rs-season" value={form.season} maxLength={40} dir="ltr"
                  onChange={e => setField('season', e.target.value)}
                  placeholder="2009/10" className={`${fieldClass()} text-right`} />
              </FormField>
            </div>

            <FormField id="rs-size" label="מידה">
              <select id="rs-size" value={form.wanted_size} onChange={e => setField('wanted_size', e.target.value)}
                className={`${fieldClass()} cursor-pointer`}>
                <option value="">עדיין לא יודעים</option>
                {SIZE_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>

            {/* The photo. Easily the most useful field on this form - a picture
                identifies a kit far faster than any description of it. */}
            <div>
              <p className="mb-1.5 text-sm font-medium text-brand-navy/70">תמונה של החולצה</p>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="התמונה שצירפתם" className="h-32 w-32 rounded-2xl object-cover" />
                  <button type="button" onClick={clearImage} aria-label="הסרת התמונה"
                    className="absolute -end-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-navy shadow-card transition hover:bg-red-600 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-line bg-brand-mist/50 py-8 transition hover:border-brand-navy/30 hover:bg-brand-mist">
                  <ImageIcon className="h-8 w-8 text-brand-navy/35" aria-hidden="true" />
                  <span className="flex items-center gap-1.5 text-[15px] font-medium text-brand-navy/75">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    צירוף תמונה
                  </span>
                  <span className="text-xs text-brand-navy/45">צילום מסך מאינסטגרם או מגוגל עובד מצוין</span>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
                </label>
              )}
              {errors.image && <p className="mt-1 text-xs text-red-600">{errors.image}</p>}
            </div>
          </Section>

          <div className="h-px bg-brand-line" />

          {/* ── How to reach them ── */}
          <Section number={2} title="איך נחזור אליכם?">
            <FormField id="rs-name" label="שם מלא" required error={errors.full_name}>
              <input id="rs-name" value={form.full_name} maxLength={100} autoComplete="name"
                onChange={e => setField('full_name', e.target.value)} className={fieldClass(errors.full_name)} />
            </FormField>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField id="rs-phone" label="טלפון" required error={errors.phone}>
                <input id="rs-phone" value={form.phone} type="tel" dir="ltr" maxLength={20} autoComplete="tel"
                  onChange={e => setField('phone', e.target.value)} className={`${fieldClass(errors.phone)} text-right`} />
              </FormField>
              <FormField id="rs-email" label="אימייל" required error={errors.email}>
                <input id="rs-email" value={form.email} type="email" dir="ltr" maxLength={254} autoComplete="email"
                  onChange={e => setField('email', e.target.value)} className={`${fieldClass(errors.email)} text-right`} />
              </FormField>
            </div>

            <ContactChannelChoice
              value={form.contact_channel}
              onChange={v => setField('contact_channel', v)}
              error={errors.contact_channel}
            />

            {form.contact_channel === 'instagram' && (
              <FormField id="rs-ig" label="שם משתמש באינסטגרם" required error={errors.instagram_handle}>
                <input id="rs-ig" value={form.instagram_handle} dir="ltr" maxLength={60} placeholder="@username"
                  onChange={e => setField('instagram_handle', e.target.value)} className={`${fieldClass(errors.instagram_handle)} text-right`} />
              </FormField>
            )}

            <FormField id="rs-notes" label="משהו נוסף שכדאי שנדע?" optional>
              <textarea id="rs-notes" value={form.notes} rows={2} maxLength={500}
                onChange={e => setField('notes', e.target.value)}
                placeholder="תקציב, עד מתי אתם צריכים אותה, גרסת שחקן או אוהד…"
                className={`${fieldClass()} resize-none py-3`} />
            </FormField>
          </Section>

          <HowItWorksNotice />

          <Honeypot value={trap} onChange={setTrap} />

          <PrivacyConsent id="rs-privacy" checked={privacyOk} onChange={setPrivacyOk} error={errors.privacy} />

          {submitError && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}

          <div>
            <button type="submit" disabled={submitting} className="shop-btn min-h-[3.75rem] w-full text-base">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              {submitting ? 'שולח…' : 'שליחת הבקשה'}
            </button>
            <p className="mt-2 text-center text-xs text-brand-navy/50">
              בלי התחייבות ובלי תשלום, בקשה בלבד.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
