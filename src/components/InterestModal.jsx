import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, ShoppingCart, Sparkles, ChevronRight, ChevronLeft, MessageCircle, Instagram, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import StepIndicator from '@/components/configurator/StepIndicator';
import SizeSelector from '@/components/configurator/SizeSelector';
import ShirtTypeChoice from '@/components/configurator/ShirtTypeChoice';
import ExactOrCustomChoice from '@/components/configurator/ExactOrCustomChoice';
import PersonalizationChoice from '@/components/configurator/PersonalizationChoice';
import NameNumberInput from '@/components/configurator/NameNumberInput';
import OrderSummary from '@/components/configurator/OrderSummary';
import { getShirtTypeTip, getPersonalizationTip } from '@/components/configurator/recommendations';
import { friendlyError } from '@/lib/errorMessages';
import ProductImage from '@/components/ui/ProductImage';
import { hasLocalStockForSize } from '@/components/ShippingBadge';
import ContactChannelChoice from '@/components/configurator/ContactChannelChoice';
import HowItWorksNotice from '@/components/HowItWorksNotice';
import { sendOrderConfirmation } from '@/lib/orderEmail';
import { SHOP_PHONE, WHATSAPP_URL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/contact';

import { getCart, setCart, cartItemTotal, cartTotal } from '@/lib/cart';

// Contact details are remembered between orders so a returning customer isn't
// retyping them; the account supplies name/email when the customer is logged in.
const CONTACT_KEY = 'jerseylab_contact';
function getSavedContact() {
  try { return JSON.parse(localStorage.getItem(CONTACT_KEY) || '{}'); } catch { return {}; }
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Shown both before and after submitting: an order still needs a human on our
// side, so nudge customers who want it moving quickly to reach out directly.
function FastHandlingNote() {
  return (
    <div className="bg-[#F2ECD9] border-r-4 border-[#E8622A] p-3">
      <p className="text-xs font-heading font-bold text-[#1B2A4A] uppercase mb-1.5">רוצה טיפול מהיר יותר?</p>
      <p className="text-xs text-[#1B2A4A]/70 font-body mb-2 leading-relaxed">
        מוזמנים לשלוח לנו הודעה ישירות — נענה ונסגור את ההזמנה מהר יותר.
      </p>
      <div className="flex flex-wrap gap-2">
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-white border-2 border-[#1B2A4A] px-2.5 py-1.5 text-xs font-body text-[#1B2A4A] hover:bg-[#1B2A4A] hover:text-white transition-colors">
          <MessageCircle className="w-3.5 h-3.5" />
          <span dir="ltr">{SHOP_PHONE}</span>
        </a>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-white border-2 border-[#1B2A4A] px-2.5 py-1.5 text-xs font-body text-[#1B2A4A] hover:bg-[#1B2A4A] hover:text-white transition-colors">
          <Instagram className="w-3.5 h-3.5" />
          <span dir="ltr">@{INSTAGRAM_HANDLE}</span>
        </a>
      </div>
    </div>
  );
}

export function CartModal({ open, onClose, user }) {
  const [cart, setCartState] = useState(getCart());
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

  // Re-seed on open so a customer who logs in mid-session picks up their
  // account details instead of whatever the modal was first mounted with.
  useEffect(() => {
    if (!open) return;
    setCartState(getCart());
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
    const c = [...cart];
    c.splice(idx, 1);
    setCart(c);
    setCartState(c);
  };

  const total = cartTotal(cart);

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
    if (!contactForm.contact_channel) errs.contact_channel = 'בחר איך נחזור אליך';
    if (contactForm.contact_channel === 'instagram' && !contactForm.instagram_handle.trim()) {
      errs.instagram_handle = 'שדה חובה';
    }
    if (!acknowledged) errs.acknowledged = 'צריך לאשר שקראת איך ההזמנה עובדת';
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
        if (item.playerVersion) extras.push('גרסת שחקן (+₪20)');
        if (item.addName) extras.push(`הדפסת שם: ${item.customName || ''} (+₪15)`);
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
      } catch { /* private mode / quota — not worth failing the order over */ }

      // Confirmation mail is best-effort: the order is already saved, so a mail
      // outage must not read to the customer as a failed checkout.
      sendOrderConfirmation({ email, fullName, orderId, items: cart, total })
        .catch(() => {});

      base44.analytics.track({ eventName: 'cart_submitted', properties: { item_count: cart.length, total, contact_channel: channel } });
      setCart([]);
      setCartState([]);
      setSubmitted(true);
    } catch (err) {
      setCartError(friendlyError(err, 'שליחת הבקשה נכשלה. נסה שוב בעוד רגע.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md text-right">
          <div className="py-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#E8622A] flex items-center justify-center mx-auto mb-4" style={{ border: '2px solid #1B2A4A', boxShadow: '3px 3px 0 #1B2A4A' }}>
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-heading font-bold text-xl mb-2 text-[#1B2A4A] uppercase">ההזמנה התקבלה!</h3>
              <p className="text-gray-500 text-sm font-body mb-1">
                נחזור אליך ב{submittedChannelLabel} בהקדם עם כל הפרטים.
              </p>
              <p className="text-gray-500 text-xs font-body flex items-center justify-center gap-1.5 mb-5">
                <Mail className="w-3.5 h-3.5" />
                אישור נשלח לאימייל שלך
              </p>
            </div>

            {/* Repeated here on purpose: this is the screen a customer is most
                likely to mistake for a completed purchase. */}
            <div className="mb-4">
              <HowItWorksNotice />
            </div>

            <FastHandlingNote />

            <div className="text-center">
              <button onClick={onClose} className="mt-5 bg-[#1B2A4A] text-white px-6 py-2.5 text-sm font-bold font-heading uppercase hover:bg-[#2a3f6b] transition-colors">
                סגור
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg text-right max-h-[85vh] overflow-y-auto">
        <DialogTitle className="font-heading text-lg uppercase text-[#1B2A4A] flex items-center gap-2 sr-only">
          <ShoppingCart className="w-5 h-5 text-[#E8622A]" />
          הסל שלי ({cart.length} פריטים)
        </DialogTitle>
        <div className="font-heading text-lg uppercase text-[#1B2A4A] flex items-center gap-2 mb-4">
          <ShoppingCart className="w-5 h-5 text-[#E8622A]" />
          הסל שלי {cart.length > 0 && `(${cart.length} פריטים)`}
        </div>

        {cart.length === 0 ? (
          <div className="py-6 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-[#1B2A4A]/20" />
            <p className="font-heading font-bold text-base text-[#1B2A4A] uppercase mb-1">הסל ריק</p>
            <p className="text-sm text-[#1B2A4A]/50 font-body mb-5">הוסף חולצות מהקטלוג כדי להתחיל.</p>
            <Link to="/catalog" onClick={onClose} className="inline-flex items-center gap-2 bg-[#E8622A] text-white px-6 py-3 font-heading font-bold text-sm uppercase tracking-wider hover:bg-[#D0551F] transition-colors" style={{ boxShadow: '3px 3px 0 #1B2A4A' }}>
              גלה חולצות
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              {cart.map((item, idx) => {
                const itemTotal = cartItemTotal(item);
                return (
                  <div key={idx} className="bg-[#F2ECD9] p-3 flex gap-3 items-start border-2 border-[#1B2A4A]" style={{ boxShadow: '2px 2px 0 #1B2A4A' }}>
                    <div className="w-16 h-16 flex-shrink-0 bg-white border-2 border-[#1B2A4A] relative overflow-hidden">
                      <ProductImage src={item.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm text-[#1B2A4A] uppercase truncate">{item.shirtName}</p>
                      <p className="text-xs text-gray-500 font-body">מידה: {item.size}</p>
                      {/* Items that price themselves (the mystery box) describe
                          their own add-ons rather than the fixed ones below. */}
                      {item.extras?.map(x => (
                        <p key={x.label} className="text-xs text-[#E8622A] font-bold font-body">{x.label} (+₪{x.price})</p>
                      ))}
                      {item.playerVersion && <p className="text-xs text-[#1B2A4A] font-bold font-body">גרסת שחקן (+₪20)</p>}
                      {item.deliveryNote ? (
                        <p className="text-xs text-[#E8622A] font-bold font-body">{item.deliveryNote}</p>
                      ) : item.isExactStockItem ? (
                        <p className="text-xs text-green-700 font-bold font-body">מלאי בארץ — עד שבוע / איסוף מקריית אונו</p>
                      ) : (
                        <p className="text-xs text-[#E8622A] font-bold font-body">משלוח מהיר — עד 3 שבועות</p>
                      )}
                      {item.addName && <p className="text-xs text-[#E8622A] font-body">הדפסת שם: {item.customName} (+₪15)</p>}
                      <p className="font-mono font-bold text-[#1B2A4A] text-sm mt-1">₪{itemTotal}</p>
                    </div>
                    <button type="button" onClick={() => removeItem(idx)} aria-label="הסר פריט מהסל"
                      className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-white border-2 border-[#1B2A4A] text-[#1B2A4A] hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center py-2 border-t-2 border-[#1B2A4A]">
              <span className="font-heading font-bold text-[#1B2A4A] uppercase">סה"כ</span>
              <span className="font-mono font-bold text-xl text-[#E8622A]">₪{total}</span>
            </div>

            <HowItWorksNotice />

            <div className="space-y-3 pt-2">
              <p className="text-sm font-heading font-bold text-[#1B2A4A] uppercase">פרטי יצירת קשר</p>
              <div>
                <label htmlFor="cart-name" className="text-sm font-medium block mb-1 font-body">שם מלא *</label>
                <input id="cart-name" value={contactForm.full_name} onChange={e => setField('full_name', e.target.value)} maxLength={100} autoComplete="name"
                  className={`w-full border-2 px-3 py-2.5 text-sm bg-white focus:outline-none ${errors.full_name ? 'border-red-500' : 'border-[#1B2A4A]'}`} />
                {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
              </div>
              <div>
                <label htmlFor="cart-phone" className="text-sm font-medium block mb-1 font-body">טלפון *</label>
                <input id="cart-phone" value={contactForm.phone} onChange={e => setField('phone', e.target.value)} type="tel" dir="ltr" maxLength={20} autoComplete="tel"
                  className={`w-full border-2 px-3 py-2.5 text-sm bg-white focus:outline-none ${errors.phone ? 'border-red-500' : 'border-[#1B2A4A]'}`} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="cart-email" className="text-sm font-medium block mb-1 font-body">אימייל *</label>
                <input id="cart-email" value={contactForm.email} onChange={e => setField('email', e.target.value)} type="email" dir="ltr" maxLength={254} autoComplete="email"
                  className={`w-full border-2 px-3 py-2.5 text-sm bg-white focus:outline-none ${errors.email ? 'border-red-500' : 'border-[#1B2A4A]'}`} />
                {errors.email ? <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  : <p className="text-[11px] text-gray-500 mt-1 font-body">לשם נשלח אישור ההזמנה.</p>}
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5 font-body">איך נוח לך שנחזור אליך? *</label>
                <ContactChannelChoice
                  value={contactForm.contact_channel}
                  onChange={v => setField('contact_channel', v)}
                  error={errors.contact_channel}
                />
              </div>

              {contactForm.contact_channel === 'instagram' && (
                <div>
                  <label htmlFor="cart-ig" className="text-sm font-medium block mb-1 font-body">שם המשתמש שלך באינסטגרם *</label>
                  <input id="cart-ig" value={contactForm.instagram_handle} onChange={e => setField('instagram_handle', e.target.value)} dir="ltr" maxLength={60} placeholder="@username"
                    className={`w-full border-2 px-3 py-2.5 text-sm bg-white focus:outline-none ${errors.instagram_handle ? 'border-red-500' : 'border-[#1B2A4A]'}`} />
                  {errors.instagram_handle && <p className="text-red-500 text-xs mt-1">{errors.instagram_handle}</p>}
                </div>
              )}
            </div>

            <FastHandlingNote />

            <div>
              <label className={`flex items-start gap-2.5 p-3 border-2 cursor-pointer transition-colors ${
                errors.acknowledged ? 'border-red-500 bg-red-50' : 'border-[#1B2A4A] bg-[#F2ECD9] hover:bg-[#E8DFC8]'
              }`}>
                <input type="checkbox" checked={acknowledged}
                  onChange={e => { setAcknowledged(e.target.checked); setErrors(p => ({ ...p, acknowledged: undefined })); }}
                  className="mt-0.5 w-4 h-4 flex-shrink-0 accent-[#E8622A]" />
                <span className="text-xs font-body text-[#1B2A4A] leading-relaxed">
                  קראתי והבנתי — <span className="font-bold">התשלום לא מתבצע באתר</span>, אלא מולכם ישירות אחרי שתחזרו אליי.
                </span>
              </label>
              {errors.acknowledged && <p className="text-red-500 text-xs mt-1">{errors.acknowledged}</p>}
            </div>

            {cartError && (
              <div className="p-2.5 bg-red-50 border-2 border-red-300 text-red-700 text-xs font-body">{cartError}</div>
            )}
            <button type="submit" disabled={submitting}
              className="w-full bg-[#E8622A] text-white py-3 font-heading font-bold text-sm uppercase tracking-wider hover:bg-[#D0551F] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ boxShadow: '3px 3px 0 #1B2A4A' }}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
              {submitting ? 'שולח...' : `שלח בקשה (₪${total})`}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function InterestModal({ shirt, open, onClose, user, initialSize, onGoToCart }) {
  const [step, setStep] = useState('size');
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    if (open) setSelectedSize(initialSize || '');
  }, [open, initialSize]);
  const [shirtType, setShirtType] = useState('');
  const [addName, setAddName] = useState('');
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [buyMode, setBuyMode] = useState(''); // '' | 'exact' | 'custom'
  const [added, setAdded] = useState(false);

  const basePrice = (() => {
    if (!shirt) return 0;
    if (shirt.is_retro) return Math.max(shirt.sale_price || shirt.price, 90);
    if (shirt.is_new || shirt.condition === 'new') return Math.max(shirt.sale_price || shirt.price, 70);
    return shirt.sale_price || shirt.price;
  })();

  // If the selected size has local stock, offer "buy this exact item"
  // (predetermined customization, fast shipping) vs a made-to-order custom
  // shirt — skips the personalization steps entirely when buying exact.
  const sizeHasLocalStock = hasLocalStockForSize(shirt, selectedSize) && !!selectedSize;
  const buyingExact = sizeHasLocalStock && buyMode === 'exact';

  const flow = [
    'size',
    ...(sizeHasLocalStock ? ['exactOrCustom'] : []),
    ...(buyingExact ? [] : ['shirtType', 'addName', ...(addName === 'yes' ? ['nameDetails'] : [])]),
    'summary',
  ];
  const currentIndex = flow.indexOf(step);
  const stepLabels = [
    'מידה',
    ...(sizeHasLocalStock ? ['בחירה'] : []),
    ...(buyingExact ? [] : ['סוג חולצה', 'הדפסה', ...(addName === 'yes' ? ['שם ומספר'] : [])]),
    'סיכום',
  ];

  const reset = () => {
    setStep('size'); setSelectedSize(''); setShirtType(''); setAddName(''); setCustomName(''); setCustomNumber('');
    setBuyMode(''); setErrors({}); setAdded(false);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleAddNameChange = (val) => {
    setAddName(val);
    if (val !== 'yes') { setCustomName(''); setCustomNumber(''); }
  };

  const [errors, setErrors] = useState({});
  const validateStep = (s) => {
    const errs = {};
    if (s === 'size' && !selectedSize) errs.size = 'יש לבחור מידה';
    if (s === 'exactOrCustom' && !buyMode) errs.buyMode = 'יש לבחור';
    if (s === 'shirtType' && !shirtType) errs.shirtType = 'יש לבחור סוג חולצה';
    if (s === 'addName' && !addName) errs.addName = 'יש לבחור';
    if (s === 'nameDetails' && (!customName.trim() || !customNumber.trim())) errs.nameDetails = 'יש למלא שם ומספר';
    return errs;
  };

  const canProceed = Object.keys(validateStep(step)).length === 0;

  const goNext = () => { const errs = validateStep(step); if (Object.keys(errs).length) { setErrors(errs); return; } setErrors({}); const idx = flow.indexOf(step); setStep(flow[idx + 1]); };
  const goBack = () => { setErrors({}); const idx = flow.indexOf(step); setStep(flow[idx - 1]); };

  const handleAddToCart = () => {
    const cart = getCart();
    cart.push({
      shirtId: shirt.id, shirtName: shirt.name, image: shirt.main_image,
      size: selectedSize, basePrice,
      addName: buyingExact ? !!shirt.local_stock_custom_name : addName === 'yes',
      customName: buyingExact ? (shirt.local_stock_custom_name || '') : (addName === 'yes' ? `${customName} ${customNumber}`.trim() : ''),
      playerVersion: buyingExact ? !!shirt.local_stock_player_version : shirtType === 'player',
      localStockSizes: shirt.local_stock_sizes || {},
      isExactStockItem: buyingExact,
    });
    setCart(cart);
    base44.analytics.track({ eventName: 'interest_added_to_cart', properties: { shirt_id: shirt.id, size: selectedSize, buy_mode: sizeHasLocalStock ? buyMode : null } });
    base44.entities.Shirt.update(shirt.id, { interest_count: (shirt.interest_count || 0) + 1 }).catch(() => {});
    setAdded(true);
  };

  const handleContinueShopping = () => { handleClose(); };
  const handleGoToCart = () => { reset(); onClose(); onGoToCart?.(); };

  if (added) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md text-right">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#E8622A] flex items-center justify-center mx-auto mb-4" style={{ border: '2px solid #1B2A4A', boxShadow: '3px 3px 0 #1B2A4A' }}>
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-heading font-bold text-xl mb-2 text-[#1B2A4A] uppercase">נוסף לסל!</h3>
            <p className="text-gray-500 text-sm font-body mb-6">רוצה להמשיך לקנות עוד, או לעבור לסל ולסיים את ההזמנה?</p>
            <div className="flex gap-2">
              <button onClick={handleContinueShopping} className="flex-1 border-2 border-[#1B2A4A] text-[#1B2A4A] px-4 py-2.5 text-sm font-bold font-heading uppercase hover:bg-[#F2ECD9] transition-colors">
                המשך לקנות
              </button>
              <button onClick={handleGoToCart} className="flex-1 bg-[#1B2A4A] text-white px-4 py-2.5 text-sm font-bold font-heading uppercase hover:bg-[#2a3f6b] transition-colors">
                עבור לסל
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md text-right max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">אני מעוניין — {shirt.name}</DialogTitle>

        <div className="flex gap-3 items-start mb-1">
          {shirt.main_image && <img src={shirt.main_image} alt="" className="w-14 h-14 object-cover border-2 border-[#1B2A4A] flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-sm text-[#1B2A4A] uppercase leading-tight truncate">{shirt.name}</p>
            <p className="font-mono font-bold text-[#E8622A] text-sm mt-0.5">₪{basePrice}</p>
          </div>
        </div>

        <StepIndicator steps={stepLabels} current={currentIndex} />

        <AnimatePresence mode="wait">
          {step === 'size' && (
            <motion.div key="size" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <h3 className="font-heading font-bold text-lg text-[#1B2A4A] mb-1">בוא נמצא את החולצה בשבילך</h3>
              <p className="text-sm text-gray-500 font-body mb-4">איזו מידה אתה מחפש?</p>
              <SizeSelector shirt={shirt} value={selectedSize} onChange={(s) => { setSelectedSize(s); setBuyMode(''); }} />
              {errors.size && <p className="text-red-500 text-xs mt-2">{errors.size}</p>}
            </motion.div>
          )}
          {step === 'exactOrCustom' && (
            <motion.div key="exactOrCustom" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <h3 className="font-heading font-bold text-lg text-[#1B2A4A] mb-1">יש לנו את זו במלאי בארץ!</h3>
              <p className="text-sm text-gray-500 font-body mb-4">רוצה לקנות בדיוק את הפריט שקיים, או להזמין גרסה משלך?</p>
              <ExactOrCustomChoice shirt={shirt} value={buyMode} onChange={setBuyMode} />
              {errors.buyMode && <p className="text-red-500 text-xs mt-2">{errors.buyMode}</p>}
            </motion.div>
          )}
          {step === 'shirtType' && (
            <motion.div key="shirtType" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <h3 className="font-heading font-bold text-lg text-[#1B2A4A] mb-1">איזה סוג חולצה?</h3>
              <div className="flex items-start gap-1.5 mb-3 text-xs text-[#1B2A4A]/70 font-body bg-[#F2ECD9] p-2.5 border-r-2 border-[#E8622A]">
                <Sparkles className="w-3.5 h-3.5 text-[#E8622A] flex-shrink-0 mt-0.5" />
                <span>{getShirtTypeTip()}</span>
              </div>
              <ShirtTypeChoice value={shirtType} onChange={setShirtType} />
              {errors.shirtType && <p className="text-red-500 text-xs mt-2">{errors.shirtType}</p>}
            </motion.div>
          )}
          {step === 'addName' && (
            <motion.div key="addName" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <h3 className="font-heading font-bold text-lg text-[#1B2A4A] mb-1">רוצה שם ומספר על הגב?</h3>
              <div className="flex items-start gap-1.5 mb-3 text-xs text-[#1B2A4A]/70 font-body bg-[#F2ECD9] p-2.5 border-r-2 border-[#E8622A]">
                <Sparkles className="w-3.5 h-3.5 text-[#E8622A] flex-shrink-0 mt-0.5" />
                <span>{getPersonalizationTip(shirt)}</span>
              </div>
              <PersonalizationChoice value={addName} onChange={handleAddNameChange} />
              {errors.addName && <p className="text-red-500 text-xs mt-2">{errors.addName}</p>}
            </motion.div>
          )}
          {step === 'nameDetails' && (
            <motion.div key="nameDetails" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <h3 className="font-heading font-bold text-lg text-[#1B2A4A] mb-1">איזה שם ומספר תרצה?</h3>
              <p className="text-sm text-gray-500 font-body mb-4">הקלד את השם והמספר להדפסה</p>
              <NameNumberInput customName={customName} customNumber={customNumber}
                onChange={(field, val) => field === 'customName' ? setCustomName(val) : setCustomNumber(val)} />
              {errors.nameDetails && <p className="text-red-500 text-xs mt-2">{errors.nameDetails}</p>}
            </motion.div>
          )}
          {step === 'summary' && (
            <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <h3 className="font-heading font-bold text-lg text-[#1B2A4A] mb-1">הכול מוכן — נשאר רק לאשר</h3>
              <p className="text-sm text-gray-500 font-body mb-4">הנה הבחירה שלך:</p>
              {buyingExact ? (
                <OrderSummary shirt={shirt} size={selectedSize}
                  shirtType={shirt.local_stock_player_version ? 'player' : 'regular'}
                  addName={shirt.local_stock_custom_name ? 'yes' : 'no'}
                  customName={shirt.local_stock_custom_name || ''} customNumber="" basePrice={basePrice} />
              ) : (
                <OrderSummary shirt={shirt} size={selectedSize} shirtType={shirtType} addName={addName}
                  customName={customName} customNumber={customNumber} basePrice={basePrice} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 mt-5">
          {step !== 'size' && (
            <button onClick={goBack} className="flex items-center gap-1 px-4 py-3 border-2 border-[#1B2A4A] text-[#1B2A4A] text-sm font-heading font-bold uppercase hover:bg-[#F2ECD9] transition-colors">
              <ChevronLeft className="w-4 h-4" /> חזור
            </button>
          )}
          {step !== 'summary' && (
            <button onClick={goNext} disabled={!canProceed}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-[#1B2A4A] text-white text-sm font-heading font-bold uppercase hover:bg-[#2a3f6b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              המשך <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {step === 'summary' && (
            <button onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#E8622A] text-white text-sm font-heading font-bold uppercase hover:bg-[#D0551F] transition-colors"
              style={{ boxShadow: '3px 3px 0 #1B2A4A' }}>
              <ShoppingCart className="w-4 h-4" /> הוסף לסל
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}