import React, { useState, useEffect } from 'react';
import { Check, Loader2, ShoppingBag, Trash2, MessageCircle, Instagram, Mail, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SideDrawer from '@/components/shop/SideDrawer';
import ProductImage from '@/components/ui/ProductImage';
import EmptyState from '@/components/ui/EmptyState';
import ContactChannelChoice from '@/components/configurator/ContactChannelChoice';
import HowItWorksNotice from '@/components/HowItWorksNotice';
import { friendlyError } from '@/lib/errorMessages';
import { sendOrderConfirmation } from '@/lib/orderEmail';
import { notifyNewOrder } from '@/lib/adminNotify';
import { SHOP_PHONE, WHATSAPP_URL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/contact';
import { getCart, setCart, cartItemTotal, cartTotal, EXTRA_PRICES, PATCHES_LABEL } from '@/lib/cart';
import { MYSTERY_BOX_ID } from '@/lib/mysteryBox';

// The cart, as a drawer from the side of the screen: the bag, then the contact
// details, then the confirmation. There is no payment on the site, so "checkout"
// is sending a request; every order becomes one InterestRequest row per item,
// sharing an order_id.

// Contact details are remembered between orders so a returning customer isn't
// retyping them; the account supplies name/email when the customer is logged in.
const CONTACT_KEY = 'jerseylab_contact';
function getSavedContact() {
  try { return JSON.parse(localStorage.getItem(CONTACT_KEY) || '{}'); } catch { return {}; }
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const itemCountLabel = (n) => (n === 1 ? 'פריט אחד' : `${n} פריטים`);

// Shown before and after submitting: an order still needs a human on our side,
// so customers who want it moving quickly are nudged to reach out directly.
function FastHandlingNote() {
  return (
    <div className="rounded-2xl border border-brand-line p-4">
      <p className="text-[15px] font-semibold text-brand-navy">רוצים טיפול מהיר יותר?</p>
      <p className="mt-1 text-[13px] leading-relaxed text-brand-navy/60">
        שלחו לנו הודעה ישירות, ונסגור את ההזמנה מהר יותר.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="shop-chip min-h-[2.5rem]">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          <span dir="ltr">{SHOP_PHONE}</span>
        </a>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="shop-chip min-h-[2.5rem]">
          <Instagram className="h-4 w-4" aria-hidden="true" />
          <span dir="ltr">@{INSTAGRAM_HANDLE}</span>
        </a>
      </div>
    </div>
  );
}

function CartItem({ item, onRemove }) {
  const total = cartItemTotal(item);
  const delivery = item.deliveryNote
    || (item.isExactStockItem ? 'מלאי בארץ · עד שבוע או איסוף מקריית אונו' : 'הזמנה מיוחדת · עד 3 שבועות');

  return (
    <li className="overflow-hidden rounded-3xl border border-brand-line">
      <div className="flex gap-4 p-4">
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-brand-mist">
          {/* The mystery box has no shirt photo of its own, so it shows the
              JerseyLab bag it arrives in. Chosen here rather than stored on the
              item, so boxes already sitting in a cart get it too. */}
          <ProductImage src={item.image || (item.shirtId === MYSTERY_BOX_ID ? '/mystery-box.jpg' : undefined)}
            alt="" sizes="96px" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-brand-navy">{item.shirtName}</p>
          <div className="mt-1 space-y-0.5 text-[13px] text-brand-navy/60">
            {item.size && <p>מידה: <span dir="ltr" className="font-medium text-brand-navy">{item.size}</span></p>}
            {item.playerVersion && <p>גרסת שחקן (+₪{EXTRA_PRICES.player})</p>}
            {item.addName && <p>הדפסה: <span dir="ltr" className="font-medium text-brand-navy">{item.customName}</span> (+₪{EXTRA_PRICES.name})</p>}
            {item.patches && <p>{`${PATCHES_LABEL} (+₪${EXTRA_PRICES.patches})`}</p>}
            {/* Items that price themselves (the mystery box) describe their own
                add-ons rather than the fixed ones above. */}
            {item.extras?.map(x => <p key={x.label}>{x.label} (+₪{x.price})</p>)}
            {/* Unpriced preferences, shown so the customer can check them. */}
            {item.details?.map(d => (
              <p key={d.label}><span className="font-medium text-brand-navy/80">{d.label}:</span> {d.value}</p>
            ))}
          </div>
          <p className={`mt-1.5 text-[13px] font-medium ${item.isExactStockItem ? 'text-emerald-700' : 'text-brand-navy/50'}`}>{delivery}</p>
          <div className="my-3 h-px bg-brand-line" />
          <p className="text-base font-semibold tabular-nums text-brand-navy">₪{total}</p>
        </div>
      </div>
      <div className="flex justify-end bg-brand-mist/70 px-4 py-1.5">
        <button type="button" onClick={onRemove} aria-label={`הסרת ${item.shirtName} מהסל`}
          className="inline-flex min-h-[2.5rem] items-center gap-1.5 text-sm font-semibold text-brand-orange-ink hover:underline">
          הסרה
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-brand-navy/70">{label}</label>
      {children}
      {error
        ? <p className="mt-1 text-xs text-red-600">{error}</p>
        : hint ? <p className="mt-1 text-xs text-brand-navy/50">{hint}</p> : null}
    </div>
  );
}

export default function CartDrawer({ open, onClose, user }) {
  const [cart, setCartState] = useState(getCart());
  const [view, setView] = useState('bag'); // 'bag' | 'details'
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    full_name: '', phone: '', email: '', contact_channel: '', instagram_handle: '',
  });
  const [errors, setErrors] = useState({});
  const [cartError, setCartError] = useState('');
  // Deliberately not persisted with the rest of the contact details: since there
  // is no payment on the site, every order should re-confirm that the customer
  // knows a request is not a purchase.
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    const handler = () => setCartState(getCart());
    window.addEventListener('cart_updated', handler);
    return () => window.removeEventListener('cart_updated', handler);
  }, []);

  // Every opening starts at the bag. A confirmation left over from the last
  // order would otherwise greet the next visit to the cart.
  useEffect(() => {
    if (!open) return;
    setCartState(getCart());
    setView('bag');
    setSubmitted(false);
    setCartError('');
  }, [open]);

  // Re-seed on open so a customer who logs in mid-session picks up their
  // account details instead of whatever the drawer was first mounted with.
  useEffect(() => {
    if (!open) return;
    const saved = getSavedContact();
    setContactForm(prev => ({
      full_name: user?.full_name || saved.full_name || prev.full_name || '',
      email: user?.email || saved.email || prev.email || '',
      phone: saved.phone || prev.phone || '',
      contact_channel: saved.contact_channel || prev.contact_channel || '',
      instagram_handle: saved.instagram_handle || prev.instagram_handle || '',
    }));
  }, [open, user]);

  const setField = (field, value) => {
    setContactForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: undefined }));
  };

  const removeItem = (idx) => {
    const next = [...cart];
    next.splice(idx, 1);
    setCart(next);
    setCartState(next);
    if (next.length === 0) setView('bag');
  };

  const total = cartTotal(cart);
  const count = cart.length;

  // The cart is emptied on success but contactForm isn't, so the confirmation
  // screen can still name the channel the customer picked.
  const submittedChannelLabel = contactForm.contact_channel === 'instagram' ? 'אינסטגרם' : 'וואטסאפ';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!contactForm.full_name.trim()) errs.full_name = 'שדה חובה';
    if (!contactForm.phone.trim()) errs.phone = 'שדה חובה';
    if (!contactForm.email.trim()) errs.email = 'שדה חובה';
    else if (!isValidEmail(contactForm.email.trim())) errs.email = 'נא להזין כתובת אימייל תקינה';
    if (!contactForm.contact_channel) errs.contact_channel = 'בחרו איך נחזור אליכם';
    if (contactForm.contact_channel === 'instagram' && !contactForm.instagram_handle.trim()) {
      errs.instagram_handle = 'שדה חובה';
    }
    if (!acknowledged) errs.acknowledged = 'צריך לאשר שקראתם איך ההזמנה עובדת';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setErrors({});
    setCartError('');

    const email = contactForm.email.trim();
    const fullName = contactForm.full_name.trim();
    const channel = contactForm.contact_channel;
    // Stored without the leading @ so the admin panel can link straight to it.
    const igHandle = contactForm.instagram_handle.trim().replace(/^@/, '');

    try {
      // Every item from this checkout shares one order_id so the admin
      // panel can show them as a single grouped order instead of N
      // disconnected rows, even though each item is still its own row.
      const orderId = crypto.randomUUID();
      for (const item of cart) {
        const extras = (item.extras || []).map(x => `${x.label} (+₪${x.price})`);
        if (item.playerVersion) extras.push(`גרסת שחקן (+₪${EXTRA_PRICES.player})`);
        if (item.addName) extras.push(`הדפסת שם: ${item.customName || ''} (+₪${EXTRA_PRICES.name})`);
        if (item.patches) extras.push(`${PATCHES_LABEL} (+₪${EXTRA_PRICES.patches})`);
        if (item.isExactStockItem) extras.push('חולצה קיימת מהמלאי בארץ');
        // Preferences carry no price but must reach the order, or asking for
        // them on the mystery box page would be theatre.
        (item.details || []).forEach(d => extras.push(`${d.label}: ${d.value}`));
        const itemTotal = cartItemTotal(item);
        await base44.entities.InterestRequest.create({
          shirt_id: item.shirtId, shirt_name: item.shirtName,
          full_name: fullName, phone: contactForm.phone.trim(),
          email,
          contact_channel: channel,
          instagram_handle: channel === 'instagram' ? igHandle : '',
          wanted_size: item.size,
          message: `סל קניות${extras.length ? ' | ' + extras.join(' | ') : ''} | מחיר סופי: ₪${itemTotal}`,
          status: 'new', user_id: user?.id || '', order_id: orderId,
        });
      }

      try {
        localStorage.setItem(CONTACT_KEY, JSON.stringify({
          full_name: fullName, phone: contactForm.phone.trim(), email,
          contact_channel: channel, instagram_handle: igHandle,
        }));
      } catch { /* private mode / quota - not worth failing the order over */ }

      // Confirmation mail is best-effort: the order is already saved, so a mail
      // outage must not read to the customer as a failed checkout.
      sendOrderConfirmation({ email, fullName, orderId, items: cart, total })
        .catch(() => {});

      // Same best-effort contract: tells the shop a request came in, so it does
      // not sit unseen until someone happens to open the admin panel.
      notifyNewOrder({
        orderId, fullName, email,
        phone: contactForm.phone.trim(),
        channel, instagramHandle: channel === 'instagram' ? igHandle : '',
        items: cart, total,
      });

      setCart([]);
      setCartState([]);
      setAcknowledged(false);
      setSubmitted(true);
    } catch (err) {
      setCartError(friendlyError(err, 'שליחת הבקשה נכשלה. נסו שוב בעוד רגע.'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field) => `shop-field ${errors[field] ? 'border-red-300 bg-red-50/60' : ''}`;

  let title;
  let body;
  let footer = null;

  if (submitted) {
    title = 'ההזמנה התקבלה';
    body = (
      <div className="pb-2 pt-4">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <Check className="h-8 w-8 text-emerald-600" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-brand-navy">תודה, קיבלנו את ההזמנה!</h3>
          <p className="mt-2 text-[15px] text-brand-navy/65">נחזור אליכם ב{submittedChannelLabel} בהקדם עם כל הפרטים.</p>
          <p className="mt-1.5 flex items-center justify-center gap-1.5 text-[13px] text-brand-navy/55">
            <Mail className="h-4 w-4" aria-hidden="true" />
            אישור נשלח לאימייל שלכם
          </p>
        </div>
        {/* Repeated here on purpose: this is the screen a customer is most
            likely to mistake for a completed purchase. */}
        <div className="mt-6 space-y-3">
          <HowItWorksNotice />
          <FastHandlingNote />
        </div>
      </div>
    );
    footer = <button type="button" onClick={onClose} className="shop-btn-dark w-full">סגירה</button>;
  } else if (count === 0) {
    title = 'הסל שלך';
    body = (
      <div className="pt-4">
        <EmptyState
          compact
          icon={ShoppingBag}
          title="הסל ריק"
          description="הוסיפו חולצות מהקטלוג, או בנו מיסטרי בוקס ונבחר עבורכם."
          actionLabel="לכל החולצות"
          actionTo="/catalog"
          secondaryLabel="מיסטרי בוקס"
          secondaryTo="/mystery-box"
        />
      </div>
    );
  } else if (view === 'bag') {
    title = `הסל שלך | ${itemCountLabel(count)}`;
    body = (
      <ul className="space-y-3 pt-1">
        {cart.map((item, idx) => <CartItem key={idx} item={item} onRemove={() => removeItem(idx)} />)}
      </ul>
    );
    footer = (
      <div>
        <p className="text-[13px] text-brand-navy/55">המשלוח והתשלום מתואמים איתכם אחרי ההזמנה. באתר לא מתבצע תשלום.</p>
        <div className="mt-3 flex items-baseline justify-between border-t border-brand-line pt-3">
          <span className="text-xl font-bold text-brand-navy">סה״כ</span>
          <span className="text-xl font-bold tabular-nums text-brand-navy">₪{total}</span>
        </div>
        <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <button type="button" onClick={onClose} className="shop-link px-2 text-[15px]">המשך בקניות</button>
          <button type="button" onClick={() => setView('details')} className="shop-btn w-full">להמשך ההזמנה</button>
        </div>
      </div>
    );
  } else {
    title = 'פרטים לחזרה אליכם';
    body = (
      <form id="cart-details-form" onSubmit={handleSubmit} noValidate className="space-y-4 pt-1">
        <button type="button" onClick={() => setView('bag')} className="shop-link text-sm">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          חזרה לסל
        </button>

        <Field id="cart-name" label="שם מלא" error={errors.full_name}>
          <input id="cart-name" value={contactForm.full_name} onChange={e => setField('full_name', e.target.value)} maxLength={100} autoComplete="name"
            aria-invalid={!!errors.full_name} className={inputClass('full_name')} />
        </Field>
        <Field id="cart-phone" label="טלפון" error={errors.phone}>
          <input id="cart-phone" value={contactForm.phone} onChange={e => setField('phone', e.target.value)} type="tel" dir="ltr" maxLength={20} autoComplete="tel"
            aria-invalid={!!errors.phone} className={`${inputClass('phone')} text-right`} />
        </Field>
        <Field id="cart-email" label="אימייל" error={errors.email} hint="לשם נשלח אישור ההזמנה.">
          <input id="cart-email" value={contactForm.email} onChange={e => setField('email', e.target.value)} type="email" dir="ltr" maxLength={254} autoComplete="email"
            aria-invalid={!!errors.email} className={`${inputClass('email')} text-right`} />
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-medium text-brand-navy/70">איך נוח שנחזור אליכם?</p>
          <ContactChannelChoice
            value={contactForm.contact_channel}
            onChange={v => setField('contact_channel', v)}
            error={errors.contact_channel}
          />
        </div>

        {contactForm.contact_channel === 'instagram' && (
          <Field id="cart-ig" label="שם המשתמש שלכם באינסטגרם" error={errors.instagram_handle}>
            <input id="cart-ig" value={contactForm.instagram_handle} onChange={e => setField('instagram_handle', e.target.value)} dir="ltr" maxLength={60} placeholder="@username"
              aria-invalid={!!errors.instagram_handle} className={`${inputClass('instagram_handle')} text-right`} />
          </Field>
        )}

        <HowItWorksNotice />
        <FastHandlingNote />

        <div>
          <label className={`flex cursor-pointer items-start gap-3 rounded-2xl p-4 transition ${errors.acknowledged ? 'bg-red-50 ring-1 ring-red-300' : 'bg-brand-mist'}`}>
            <input type="checkbox" checked={acknowledged}
              onChange={e => { setAcknowledged(e.target.checked); setErrors(p => ({ ...p, acknowledged: undefined })); }}
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-brand-orange" />
            <span className="text-[13px] leading-relaxed text-brand-navy">
              קראתי והבנתי: <span className="font-semibold">התשלום לא מתבצע באתר</span>, אלא מולכם ישירות אחרי שתחזרו אליי.
            </span>
          </label>
          {errors.acknowledged && <p className="mt-1 text-xs text-red-600">{errors.acknowledged}</p>}
        </div>

        {cartError && (
          <div role="alert" className="rounded-2xl bg-red-50 p-3 text-[13px] text-red-700">{cartError}</div>
        )}
      </form>
    );
    footer = (
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-semibold text-brand-navy">סה״כ ({itemCountLabel(count)})</span>
          <span className="text-lg font-bold tabular-nums text-brand-navy">₪{total}</span>
        </div>
        <button type="submit" form="cart-details-form" disabled={submitting} className="shop-btn mt-3 w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
          {submitting ? 'שולח...' : 'שליחת ההזמנה'}
        </button>
      </div>
    );
  }

  return (
    <SideDrawer open={open} onOpenChange={(next) => { if (!next) onClose(); }} side="end" title={title} footer={footer}>
      {body}
    </SideDrawer>
  );
}
