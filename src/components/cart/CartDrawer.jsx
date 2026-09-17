import React, { useState, useEffect } from 'react';
import { Check, Loader2, ShoppingBag, Trash2, MessageCircle, Instagram, Mail, ChevronRight, Ticket, X } from 'lucide-react';
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
import { getCart, setCart, cartItemTotal, cartTotal, EXTRA_PRICES, PATCHES_LABEL, LONG_SLEEVE_LABEL, SHORTS_LABEL } from '@/lib/cart';
import { MYSTERY_BOX_ID } from '@/lib/mysteryBox';
import { checkCoupon, redeemCoupon, applyCoupon, normalizeCode } from '@/lib/coupons';
import { t } from '@/lib/i18n';

// The cart, as a drawer from the side of the screen: the bag, then the contact
// details, then the confirmation. There is no payment on the site, so "checkout"
// is sending a request; every order becomes one InterestRequest row per item,
// sharing an order_id.
//
// The order that is saved stays in Hebrew whatever language the customer
// browses in - it is read by the shop, and the admin panel and the supplier
// text parse its wording. Only what the customer sees here is translated.

// Contact details are remembered between orders so a returning customer isn't
// retyping them; the account supplies name/email when the customer is logged in.
const CONTACT_KEY = 'jerseylab_contact';
function getSavedContact() {
  try { return JSON.parse(localStorage.getItem(CONTACT_KEY) || '{}'); } catch { return {}; }
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// The coupon field under the bag: a link until it is needed, then a field,
// then the applied code with what it takes off - or why it takes nothing off.
function CouponBox({ coupon, pricing, onApply, onRemove }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (coupon) {
    return (
      <div className="rounded-2xl bg-brand-mist px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />
          <span dir="ltr" className="font-semibold tracking-wide text-brand-navy">{coupon.code}</span>
          {pricing.discount > 0 && (
            <span className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-400">-₪{pricing.discount}</span>
          )}
          <button type="button" onClick={onRemove} aria-label={t('הסרת הקופון', 'Remove coupon')}
            className="ms-auto flex h-8 w-8 items-center justify-center rounded-full text-brand-navy/50 transition hover:bg-white hover:text-brand-navy">
            <X className="h-4 w-4" />
          </button>
        </div>
        {pricing.message && <p className="mt-1 text-[12px] leading-relaxed text-brand-orange-ink">{pricing.message}</p>}
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="shop-link text-[13px]">
        <Ticket className="h-4 w-4" aria-hidden="true" />
        {t('יש לכם קוד קופון?', 'Have a coupon code?')}
      </button>
    );
  }

  const apply = async (e) => {
    e.preventDefault();
    if (!normalizeCode(code)) return;
    setBusy(true);
    setError('');
    const result = await checkCoupon(code);
    setBusy(false);
    if (!result.ok) { setError(result.message); return; }
    setCode('');
    setOpen(false);
    onApply(result.coupon);
  };

  return (
    <form onSubmit={apply} noValidate>
      <label htmlFor="cart-coupon" className="mb-1.5 block text-[13px] font-medium text-brand-navy/70">{t('קוד קופון', 'Coupon code')}</label>
      <div className="flex gap-2">
        <input id="cart-coupon" value={code} onChange={e => { setCode(e.target.value); setError(''); }}
          dir="ltr" maxLength={40} autoComplete="off" autoCapitalize="characters" autoFocus
          aria-invalid={!!error} aria-describedby={error ? 'cart-coupon-error' : undefined}
          className={`shop-field min-w-0 flex-1 text-start uppercase ${error ? 'border-red-300' : ''}`} />
        <button type="submit" disabled={busy || !code.trim()} className="shop-btn-dark flex-shrink-0 px-4">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('החלה', 'Apply')}
        </button>
      </div>
      {error && <p id="cart-coupon-error" role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </form>
  );
}

// Subtotal and discount above the total, only when a coupon takes something off.
function DiscountLines({ subtotal, pricing }) {
  if (!pricing.discount) return null;
  return (
    <dl className="space-y-1 text-[14px]">
      <div className="flex justify-between text-brand-navy/65">
        <dt>{t('לפני הנחה', 'Before discount')}</dt>
        <dd className="tabular-nums">₪{subtotal}</dd>
      </div>
      <div className="flex justify-between font-semibold text-emerald-700 dark:text-emerald-400">
        <dt>{t('הנחת קופון', 'Coupon discount')}</dt>
        <dd className="tabular-nums">-₪{pricing.discount}</dd>
      </div>
    </dl>
  );
}

const itemCountLabel = (n) => (n === 1 ? t('פריט אחד', '1 item') : t(`${n} פריטים`, `${n} items`));

// Shown before and after submitting: an order still needs a human on our side,
// so customers who want it moving quickly are nudged to reach out directly.
function FastHandlingNote() {
  return (
    <div className="rounded-2xl border border-brand-line p-4">
      <p className="text-[15px] font-semibold text-brand-navy">{t('רוצים טיפול מהיר יותר?', 'Want it handled faster?')}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-brand-navy/60">
        {t('שלחו לנו הודעה ישירות, ונסגור את ההזמנה מהר יותר.', "Message us directly and we'll finalise your order sooner.")}
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
  const name = t(item.shirtName, item.shirtNameEn);
  const delivery = t(item.deliveryNote, item.deliveryNoteEn)
    || (item.isExactStockItem
      ? t('מלאי בארץ · עד שבוע או איסוף מקריית אונו', 'In stock in Israel · up to a week, or pick up in Kiryat Ono')
      : t('הזמנה מיוחדת · עד 3 שבועות', 'Made to order · up to 3 weeks'));

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
          <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-brand-navy">{name}</p>
          <div className="mt-1 space-y-0.5 text-[13px] text-brand-navy/60">
            {item.size && <p>{t('מידה:', 'Size:')} <span dir="ltr" className="font-medium text-brand-navy">{item.size}</span></p>}
            {item.playerVersion && <p>{t('גרסת שחקן', 'Player version')} (+₪{EXTRA_PRICES.player})</p>}
            {item.addName && <p>{t('הדפסה:', 'Printing:')} <span dir="ltr" className="font-medium text-brand-navy">{item.customName}</span> (+₪{EXTRA_PRICES.name})</p>}
            {item.longSleeve && <p>{`${t(LONG_SLEEVE_LABEL, 'Long sleeve')} (+₪${EXTRA_PRICES.longSleeve})`}</p>}
            {item.shorts && <p>{`${t(`${SHORTS_LABEL} במידה ${item.size}`, `Shorts, size ${item.size}`)} (+₪${EXTRA_PRICES.shorts})`}</p>}
            {item.patches && <p>{`${t(PATCHES_LABEL, 'Patches')} (+₪${EXTRA_PRICES.patches})`}</p>}
            {/* Items that price themselves (the mystery box) describe their own
                add-ons rather than the fixed ones above. */}
            {item.extras?.map(x => <p key={x.label}>{t(x.label, x.labelEn)} (+₪{x.price})</p>)}
            {/* Unpriced preferences, shown so the customer can check them. */}
            {item.details?.map(d => (
              <p key={d.label}><span className="font-medium text-brand-navy/80">{t(d.label, d.labelEn)}:</span> {t(d.value, d.valueEn)}</p>
            ))}
          </div>
          <p className={`mt-1.5 text-[13px] font-medium ${item.isExactStockItem ? 'text-emerald-700' : 'text-brand-navy/50'}`}>{delivery}</p>
          <div className="my-3 h-px bg-brand-line" />
          <p className="text-base font-semibold tabular-nums text-brand-navy">₪{total}</p>
        </div>
      </div>
      <div className="flex justify-end bg-brand-mist/70 px-4 py-1.5">
        <button type="button" onClick={onRemove} aria-label={t(`הסרת ${name} מהסל`, `Remove ${name} from the cart`)}
          className="inline-flex min-h-[2.5rem] items-center gap-1.5 text-sm font-semibold text-brand-orange-ink hover:underline">
          {t('הסרה', 'Remove')}
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
  // Kept while the drawer is closed and reopened, cleared once an order is sent.
  const [coupon, setCoupon] = useState(null);
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

  const subtotal = cartTotal(cart);
  const pricing = applyCoupon(cart, coupon);
  const total = cartTotal(pricing.items);
  const count = cart.length;

  // The cart is emptied on success but contactForm isn't, so the confirmation
  // screen can still name the channel the customer picked.
  const submittedChannelLabel = contactForm.contact_channel === 'instagram' ? t('אינסטגרם', 'Instagram') : t('וואטסאפ', 'WhatsApp');

  const required = t('שדה חובה', 'Required');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!contactForm.full_name.trim()) errs.full_name = required;
    if (!contactForm.phone.trim()) errs.phone = required;
    if (!contactForm.email.trim()) errs.email = required;
    else if (!isValidEmail(contactForm.email.trim())) errs.email = t('נא להזין כתובת אימייל תקינה', 'Please enter a valid email address');
    if (!contactForm.contact_channel) errs.contact_channel = t('בחרו איך נחזור אליכם', 'Choose how we should get back to you');
    if (contactForm.contact_channel === 'instagram' && !contactForm.instagram_handle.trim()) {
      errs.instagram_handle = required;
    }
    if (!acknowledged) errs.acknowledged = t('צריך לאשר שקראתם איך ההזמנה עובדת', 'Please confirm you have read how ordering works');
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setErrors({});
    setCartError('');

    const email = contactForm.email.trim();
    const fullName = contactForm.full_name.trim();
    const channel = contactForm.contact_channel;
    // Stored without the leading @ so the admin panel can link straight to it.
    const igHandle = contactForm.instagram_handle.trim().replace(/^@/, '');
    const phone = contactForm.phone.trim();

    // The code is checked again with the customer's details: it may have run
    // out since it was applied, or be limited to one use per customer.
    let order = { items: cart, discount: 0 };
    if (coupon) {
      const recheck = await checkCoupon(coupon.code, { email, phone });
      if (!recheck.ok) {
        setCoupon(null);
        setCartError(`${recheck.message}. ${t('הקופון הוסר - בדקו את הסכום ושלחו שוב.', 'The coupon was removed - check the total and send again.')}`);
        setSubmitting(false);
        return;
      }
      order = applyCoupon(cart, recheck.coupon);
    }
    const orderTotal = cartTotal(order.items);

    try {
      // Every item from this checkout shares one order_id so the admin
      // panel can show them as a single grouped order instead of N
      // disconnected rows, even though each item is still its own row.
      const orderId = crypto.randomUUID();
      for (const item of order.items) {
        const extras = (item.extras || []).map(x => `${x.label} (+₪${x.price})`);
        if (item.playerVersion) extras.push(`גרסת שחקן (+₪${EXTRA_PRICES.player})`);
        if (item.addName) extras.push(`הדפסת שם: ${item.customName || ''} (+₪${EXTRA_PRICES.name})`);
        if (item.longSleeve) extras.push(`${LONG_SLEEVE_LABEL} (+₪${EXTRA_PRICES.longSleeve})`);
        if (item.shorts) extras.push(`${SHORTS_LABEL} (+₪${EXTRA_PRICES.shorts})`);
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
      if (order.discount > 0) {
        // Counts the use; best effort, like the emails below.
        Promise.resolve(redeemCoupon({ code: coupon.code, orderId, email, phone, discount: order.discount })).catch(() => {});
      }

      sendOrderConfirmation({
        email, fullName, orderId, items: order.items, total: orderTotal,
        discount: order.discount, couponCode: order.discount > 0 ? coupon.code : '',
      })
        .catch(() => {});

      // Same best-effort contract: tells the shop a request came in, so it does
      // not sit unseen until someone happens to open the admin panel.
      notifyNewOrder({
        orderId, fullName, email,
        phone: contactForm.phone.trim(),
        channel, instagramHandle: channel === 'instagram' ? igHandle : '',
        items: order.items, total: orderTotal,
      });

      setCart([]);
      setCartState([]);
      setCoupon(null);
      setAcknowledged(false);
      setSubmitted(true);
    } catch (err) {
      setCartError(friendlyError(err, t('שליחת הבקשה נכשלה. נסו שוב בעוד רגע.', "We couldn't send your order. Please try again in a moment.")));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field) => `shop-field ${errors[field] ? 'border-red-300 bg-red-50/60' : ''}`;

  let title;
  let body;
  let footer = null;

  if (submitted) {
    title = t('ההזמנה התקבלה', 'Order received');
    body = (
      <div className="pb-2 pt-4">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <Check className="h-8 w-8 text-emerald-600" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-brand-navy">{t('תודה, קיבלנו את ההזמנה!', 'Thank you, we have your order!')}</h3>
          <p className="mt-2 text-[15px] text-brand-navy/65">
            {t(`נחזור אליכם ב${submittedChannelLabel} בהקדם עם כל הפרטים.`, `We'll get back to you on ${submittedChannelLabel} soon with all the details.`)}
          </p>
          <p className="mt-1.5 flex items-center justify-center gap-1.5 text-[13px] text-brand-navy/55">
            <Mail className="h-4 w-4" aria-hidden="true" />
            {t('אישור נשלח לאימייל שלכם', 'A confirmation was sent to your email')}
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
    footer = <button type="button" onClick={onClose} className="shop-btn-dark w-full">{t('סגירה', 'Close')}</button>;
  } else if (count === 0) {
    title = t('הסל שלך', 'Your cart');
    body = (
      <div className="pt-4">
        <EmptyState
          compact
          icon={ShoppingBag}
          title={t('הסל ריק', 'Your cart is empty')}
          description={t('הוסיפו חולצות מהקטלוג, או בנו מיסטרי בוקס ונבחר עבורכם.', 'Add shirts from the catalog, or build a Mystery Box for a surprise.')}
          actionLabel={t('לכל החולצות', 'All shirts')}
          actionTo="/catalog"
          secondaryLabel={t('מיסטרי בוקס', 'Mystery Box')}
          secondaryTo="/mystery-box"
        />
      </div>
    );
  } else if (view === 'bag') {
    title = `${t('הסל שלך', 'Your cart')} | ${itemCountLabel(count)}`;
    body = (
      <ul className="space-y-3 pt-1">
        {cart.map((item, idx) => <CartItem key={idx} item={item} onRemove={() => removeItem(idx)} />)}
      </ul>
    );
    footer = (
      <div>
        <CouponBox coupon={coupon} pricing={pricing} onApply={setCoupon} onRemove={() => setCoupon(null)} />
        <p className="mt-3 text-[13px] text-brand-navy/55">{t('המשלוח והתשלום מתואמים איתכם אחרי ההזמנה. באתר לא מתבצע תשלום.', 'Shipping and payment are arranged with you after you order. Nothing is charged on the site.')}</p>
        <div className="mt-3 border-t border-brand-line pt-3">
          <DiscountLines subtotal={subtotal} pricing={pricing} />
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xl font-bold text-brand-navy">{t('סה״כ', 'Total')}</span>
          <span className="text-xl font-bold tabular-nums text-brand-navy">₪{total}</span>
        </div>
        <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <button type="button" onClick={onClose} className="shop-link px-2 text-[15px]">{t('המשך בקניות', 'Keep shopping')}</button>
          <button type="button" onClick={() => setView('details')} className="shop-btn w-full">{t('להמשך ההזמנה', 'Continue')}</button>
        </div>
      </div>
    );
  } else {
    title = t('פרטים לחזרה אליכם', 'Your contact details');
    body = (
      <form id="cart-details-form" onSubmit={handleSubmit} noValidate className="space-y-4 pt-1">
        <button type="button" onClick={() => setView('bag')} className="shop-link text-sm">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          {t('חזרה לסל', 'Back to cart')}
        </button>

        <Field id="cart-name" label={t('שם מלא', 'Full name')} error={errors.full_name}>
          <input id="cart-name" value={contactForm.full_name} onChange={e => setField('full_name', e.target.value)} maxLength={100} autoComplete="name"
            aria-invalid={!!errors.full_name} className={inputClass('full_name')} />
        </Field>
        <Field id="cart-phone" label={t('טלפון', 'Phone')} error={errors.phone}>
          <input id="cart-phone" value={contactForm.phone} onChange={e => setField('phone', e.target.value)} type="tel" dir="ltr" maxLength={20} autoComplete="tel"
            aria-invalid={!!errors.phone} className={`${inputClass('phone')} text-start`} />
        </Field>
        <Field id="cart-email" label={t('אימייל', 'Email')} error={errors.email} hint={t('לשם נשלח אישור ההזמנה.', "We'll send the order confirmation here.")}>
          <input id="cart-email" value={contactForm.email} onChange={e => setField('email', e.target.value)} type="email" dir="ltr" maxLength={254} autoComplete="email"
            aria-invalid={!!errors.email} className={`${inputClass('email')} text-start`} />
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-medium text-brand-navy/70">{t('איך נוח שנחזור אליכם?', 'How should we get back to you?')}</p>
          <ContactChannelChoice
            value={contactForm.contact_channel}
            onChange={v => setField('contact_channel', v)}
            error={errors.contact_channel}
          />
        </div>

        {contactForm.contact_channel === 'instagram' && (
          <Field id="cart-ig" label={t('שם המשתמש שלכם באינסטגרם', 'Your Instagram username')} error={errors.instagram_handle}>
            <input id="cart-ig" value={contactForm.instagram_handle} onChange={e => setField('instagram_handle', e.target.value)} dir="ltr" maxLength={60} placeholder="@username"
              aria-invalid={!!errors.instagram_handle} className={`${inputClass('instagram_handle')} text-start`} />
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
              {t('קראתי והבנתי:', 'I have read and understood:')}{' '}
              <span className="font-semibold">{t('התשלום לא מתבצע באתר', 'payment is not made on the site')}</span>
              {t(', אלא מולכם ישירות אחרי שתחזרו אליי.', ', but directly with you after you get back to me.')}
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
        <DiscountLines subtotal={subtotal} pricing={pricing} />
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-lg font-semibold text-brand-navy">{t('סה״כ', 'Total')} ({itemCountLabel(count)})</span>
          <span className="text-lg font-bold tabular-nums text-brand-navy">₪{total}</span>
        </div>
        <button type="submit" form="cart-details-form" disabled={submitting} className="shop-btn mt-3 w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
          {submitting ? t('שולח...', 'Sending...') : t('שליחת ההזמנה', 'Send order')}
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
