import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, ShoppingCart, Sparkles, ChevronRight, ChevronLeft, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import StepIndicator from '@/components/configurator/StepIndicator';
import SizeSelector from '@/components/configurator/SizeSelector';
import ShirtTypeChoice from '@/components/configurator/ShirtTypeChoice';
import PersonalizationChoice from '@/components/configurator/PersonalizationChoice';
import NameNumberInput from '@/components/configurator/NameNumberInput';
import OrderSummary from '@/components/configurator/OrderSummary';
import { getShirtTypeTip, getPersonalizationTip, calcTotal } from '@/components/configurator/recommendations';
import { friendlyError } from '@/lib/errorMessages';

// Cart stored in sessionStorage so it persists across page navigations in same session
function getCart() {
  try { return JSON.parse(sessionStorage.getItem('jerseylab_cart') || '[]'); } catch { return []; }
}
function setCart(cart) {
  sessionStorage.setItem('jerseylab_cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('cart_updated'));
}

export function CartModal({ open, onClose, user }) {
  const [cart, setCartState] = useState(getCart());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ full_name: user?.full_name || '', phone: '' });
  const [errors, setErrors] = useState({});
  const [cartError, setCartError] = useState('');

  useEffect(() => {
    const handler = () => setCartState(getCart());
    window.addEventListener('cart_updated', handler);
    return () => window.removeEventListener('cart_updated', handler);
  }, []);

  useEffect(() => { if (open) setCartState(getCart()); }, [open]);

  const removeItem = (idx) => {
    const c = [...cart];
    c.splice(idx, 1);
    setCart(c);
    setCartState(c);
  };

  const total = cart.reduce((sum, item) => {
    let price = item.basePrice;
    if (item.addName) price += 15;
    if (item.playerVersion) price += 20;
    return sum + price;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!contactForm.full_name.trim()) errs.full_name = 'שדה חובה';
    if (!contactForm.phone.trim()) errs.phone = 'שדה חובה';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setErrors({});
    setCartError('');
    try {
      for (const item of cart) {
        const extras = [];
        if (item.playerVersion) extras.push('גרסת שחקן (+₪20)');
        if (item.addName) extras.push(`הדפסת שם: ${item.customName || ''} (+₪15)`);
        const itemTotal = item.basePrice + (item.addName ? 15 : 0) + (item.playerVersion ? 20 : 0);
        await base44.entities.InterestRequest.create({
          shirt_id: item.shirtId, shirt_name: item.shirtName,
          full_name: contactForm.full_name.trim(), phone: contactForm.phone.trim(),
          wanted_size: item.size,
          message: `סל קניות${extras.length ? ' | ' + extras.join(' | ') : ''} | מחיר סופי: ₪${itemTotal}`,
          status: 'new', user_id: user?.id || '',
        });
      }
      base44.analytics.track({ eventName: 'cart_submitted', properties: { item_count: cart.length, total } });
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
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#E8622A] flex items-center justify-center mx-auto mb-4" style={{ border: '2px solid #1B2A4A', boxShadow: '3px 3px 0 #1B2A4A' }}>
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-heading font-bold text-xl mb-2 text-[#1B2A4A] uppercase">הבקשה נשלחה!</h3>
            <p className="text-gray-500 text-sm font-body">נחזור אליך בהקדם עם כל הפרטים.</p>
            <button onClick={onClose} className="mt-6 bg-[#1B2A4A] text-white px-6 py-2.5 text-sm font-bold font-heading uppercase hover:bg-[#2a3f6b] transition-colors">
              סגור
            </button>
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
          הסל שלי ({cart.length} פריטים)
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
                const itemTotal = item.basePrice + (item.addName ? 15 : 0) + (item.playerVersion ? 20 : 0);
                return (
                  <div key={idx} className="bg-[#F2ECD9] p-3 flex gap-3 items-start" style={{ border: '2px solid #1B2A4A' }}>
                    {item.image && <img src={item.image} alt="" className="w-14 h-14 object-cover flex-shrink-0 border border-[#1B2A4A]" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm text-[#1B2A4A] uppercase truncate">{item.shirtName}</p>
                      <p className="text-xs text-gray-500 font-body">מידה: {item.size}</p>
                      {item.playerVersion && <p className="text-xs text-[#1B2A4A] font-bold font-body">גרסת שחקן (+₪20)</p>}
                      {item.localStockSizes && Number(item.localStockSizes[item.size]) > 0 ? (
                        <p className="text-xs text-green-700 font-bold font-body">מלאי בארץ — עד שבוע / איסוף מקריית אונו</p>
                      ) : (
                        <p className="text-xs text-[#E8622A] font-bold font-body">משלוח מהיר — עד 3 שבועות</p>
                      )}
                      {item.addName && <p className="text-xs text-[#E8622A] font-body">הדפסת שם: {item.customName} (+₪15)</p>}
                      <p className="font-mono font-bold text-[#1B2A4A] text-sm mt-1">₪{itemTotal}</p>
                    </div>
                    <button type="button" onClick={() => removeItem(idx)} aria-label="הסר פריט מהסל" className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center py-2 border-t-2 border-[#1B2A4A]">
              <span className="font-heading font-bold text-[#1B2A4A] uppercase">סה"כ</span>
              <span className="font-mono font-bold text-xl text-[#E8622A]">₪{total}</span>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-sm font-heading font-bold text-[#1B2A4A] uppercase">פרטי יצירת קשר</p>
              <div>
                <label htmlFor="cart-name" className="text-sm font-medium block mb-1 font-body">שם מלא *</label>
                <input id="cart-name" value={contactForm.full_name} onChange={e => { setContactForm(p => ({ ...p, full_name: e.target.value })); setErrors(p => ({ ...p, full_name: undefined })); }} maxLength={100} autoComplete="name"
                  className={`w-full border-2 px-3 py-2.5 text-sm bg-white focus:outline-none ${errors.full_name ? 'border-red-500' : 'border-[#1B2A4A]'}`} />
                {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
              </div>
              <div>
                <label htmlFor="cart-phone" className="text-sm font-medium block mb-1 font-body">טלפון *</label>
                <input id="cart-phone" value={contactForm.phone} onChange={e => { setContactForm(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: undefined })); }} type="tel" dir="ltr" maxLength={20} autoComplete="tel"
                  className={`w-full border-2 px-3 py-2.5 text-sm bg-white focus:outline-none ${errors.phone ? 'border-red-500' : 'border-[#1B2A4A]'}`} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
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

export default function InterestModal({ shirt, open, onClose, user, initialSize }) {
  const [step, setStep] = useState('size');
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    if (open) setSelectedSize(initialSize || '');
  }, [open, initialSize]);
  const [shirtType, setShirtType] = useState('');
  const [addName, setAddName] = useState('');
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [contact, setContact] = useState({ full_name: user?.full_name || '', phone: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const basePrice = (() => {
    if (!shirt) return 0;
    if (shirt.is_retro) return Math.max(shirt.sale_price || shirt.price, 90);
    if (shirt.is_new || shirt.condition === 'new') return Math.max(shirt.sale_price || shirt.price, 70);
    return shirt.sale_price || shirt.price;
  })();

  const total = calcTotal(basePrice, shirtType, addName);

  const flow = ['size', 'shirtType', 'addName', ...(addName === 'yes' ? ['nameDetails'] : []), 'contact', 'summary'];
  const currentIndex = flow.indexOf(step);
  const stepLabels = ['מידה', 'סוג חולצה', 'הדפסה', ...(addName === 'yes' ? ['שם ומספר'] : []), 'יצירת קשר', 'סיכום'];

  const reset = () => {
    setStep('size'); setSelectedSize(''); setShirtType(''); setAddName(''); setCustomName(''); setCustomNumber('');
    setContact({ full_name: user?.full_name || '', phone: '', message: '' });
    setErrors({}); setSubmitted(false);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleAddNameChange = (val) => {
    setAddName(val);
    if (val !== 'yes') { setCustomName(''); setCustomNumber(''); }
  };

  const validateStep = (s) => {
    const errs = {};
    if (s === 'size' && !selectedSize) errs.size = 'יש לבחור מידה';
    if (s === 'shirtType' && !shirtType) errs.shirtType = 'יש לבחור סוג חולצה';
    if (s === 'addName' && !addName) errs.addName = 'יש לבחור';
    if (s === 'nameDetails' && (!customName.trim() || !customNumber.trim())) errs.nameDetails = 'יש למלא שם ומספר';
    if (s === 'contact') {
      if (!contact.full_name.trim()) errs.full_name = 'שדה חובה';
      if (!contact.phone.trim()) errs.phone = 'שדה חובה';
    }
    return errs;
  };

  const canProceed = Object.keys(validateStep(step)).length === 0;

  const goNext = () => { const errs = validateStep(step); if (Object.keys(errs).length) { setErrors(errs); return; } setErrors({}); const idx = flow.indexOf(step); setStep(flow[idx + 1]); };
  const goBack = () => { setErrors({}); const idx = flow.indexOf(step); setStep(flow[idx - 1]); };

  const [submitError, setSubmitError] = useState('');
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    const extras = [];
    if (shirtType === 'player') extras.push('גרסת שחקן (+₪20)');
    if (addName === 'yes') extras.push(`הדפסת שם: ${customName} ${customNumber} (+₪15)`);
    try {
      await base44.entities.InterestRequest.create({
        shirt_id: shirt.id, shirt_name: shirt.name,
        full_name: contact.full_name.trim(), phone: contact.phone.trim(),
        wanted_size: selectedSize,
        message: [contact.message, ...extras].filter(Boolean).join(' | ') + ` | מחיר: ₪${total}`,
        status: 'new', user_id: user?.id || '',
      });
      base44.analytics.track({ eventName: 'interest_submitted', properties: { shirt_id: shirt.id, size: selectedSize, total } });
      base44.entities.Shirt.update(shirt.id, { interest_count: (shirt.interest_count || 0) + 1 }).catch(() => {});
      setSubmitted(true);
    } catch (err) {
      setSubmitError(friendlyError(err, 'שליחת הבקשה נכשלה. נסה שוב בעוד רגע.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md text-right">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#E8622A] flex items-center justify-center mx-auto mb-4" style={{ border: '2px solid #1B2A4A', boxShadow: '3px 3px 0 #1B2A4A' }}>
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-heading font-bold text-xl mb-2 text-[#1B2A4A] uppercase">הבקשה נשלחה!</h3>
            <p className="text-gray-500 text-sm font-body">נחזור אליך בהקדם האפשרי עם כל הפרטים.</p>
            <button onClick={handleClose} className="mt-6 bg-[#1B2A4A] text-white px-6 py-2.5 text-sm font-bold font-heading uppercase hover:bg-[#2a3f6b] transition-colors">
              סגור
            </button>
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
              <SizeSelector shirt={shirt} value={selectedSize} onChange={setSelectedSize} />
              {errors.size && <p className="text-red-500 text-xs mt-2">{errors.size}</p>}
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
          {step === 'contact' && (
            <motion.div key="contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <h3 className="font-heading font-bold text-lg text-[#1B2A4A] mb-1">איך ניצור איתך קשר?</h3>
              <p className="text-sm text-gray-500 font-body mb-4">נחזור אליך עם פרטי החולצה והזמינות</p>
              <div className="space-y-3">
                <div>
                  <label htmlFor="interest-name" className="text-sm font-medium block mb-1 font-body">שם מלא *</label>
                  <input id="interest-name" value={contact.full_name} onChange={e => { setContact(p => ({ ...p, full_name: e.target.value })); setErrors(p => ({ ...p, full_name: undefined })); }} maxLength={100} autoComplete="name"
                    className={`w-full border-2 px-3 py-2.5 text-sm bg-white focus:outline-none ${errors.full_name ? 'border-red-500' : 'border-[#1B2A4A]'}`} />
                  {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                </div>
                <div>
                  <label htmlFor="interest-phone" className="text-sm font-medium block mb-1 font-body">טלפון *</label>
                  <input id="interest-phone" value={contact.phone} onChange={e => { setContact(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: undefined })); }} type="tel" dir="ltr" maxLength={20} autoComplete="tel"
                    className={`w-full border-2 px-3 py-2.5 text-sm bg-white focus:outline-none ${errors.phone ? 'border-red-500' : 'border-[#1B2A4A]'}`} />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label htmlFor="interest-message" className="text-sm font-medium block mb-1 font-body">משהו מיוחד שאתה מחפש? (אופציונלי)</label>
                  <textarea id="interest-message" value={contact.message} onChange={e => setContact(p => ({ ...p, message: e.target.value }))} rows={2} maxLength={1000}
                    className="w-full border-2 border-[#1B2A4A] px-3 py-2.5 text-sm bg-white focus:outline-none resize-none font-body" />
                </div>
              </div>
            </motion.div>
          )}
          {step === 'summary' && (
            <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <h3 className="font-heading font-bold text-lg text-[#1B2A4A] mb-1">הכול מוכן — נשאר רק לאשר</h3>
              <p className="text-sm text-gray-500 font-body mb-4">הנה הבקשה שלך:</p>
              <OrderSummary shirt={shirt} size={selectedSize} shirtType={shirtType} addName={addName}
                customName={customName} customNumber={customNumber} basePrice={basePrice} />
              <div className="bg-white border-2 border-[#1B2A4A]/30 p-3 mt-3 space-y-1 text-sm font-body">
                <div className="flex justify-between"><span className="text-gray-500">שם</span><span className="font-bold text-[#1B2A4A]">{contact.full_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">טלפון</span><span className="font-bold text-[#1B2A4A] font-mono" dir="ltr">{contact.phone}</span></div>
                {contact.message && <div className="flex justify-between gap-2"><span className="text-gray-500 flex-shrink-0">הערה</span><span className="text-[#1B2A4A] text-left">{contact.message}</span></div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {submitError && (
          <div className="p-2.5 bg-red-50 border-2 border-red-300 text-red-700 text-xs font-body mb-3">{submitError}</div>
        )}
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
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#E8622A] text-white text-sm font-heading font-bold uppercase hover:bg-[#D0551F] transition-colors disabled:opacity-50"
              style={{ boxShadow: '3px 3px 0 #1B2A4A' }}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'שולח...' : 'שליחת בקשה'}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}