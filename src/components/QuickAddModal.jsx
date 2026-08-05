import React, { useState } from 'react';
import { ShoppingCart, Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import StepIndicator from '@/components/configurator/StepIndicator';
import SizeSelector from '@/components/configurator/SizeSelector';
import ShirtTypeChoice from '@/components/configurator/ShirtTypeChoice';
import ExactOrCustomChoice from '@/components/configurator/ExactOrCustomChoice';
import PersonalizationChoice from '@/components/configurator/PersonalizationChoice';
import NameNumberInput from '@/components/configurator/NameNumberInput';
import OrderSummary from '@/components/configurator/OrderSummary';
import { getShirtTypeTip, getPersonalizationTip } from '@/components/configurator/recommendations';

function getCart() {
  try { return JSON.parse(sessionStorage.getItem('jerseylab_cart') || '[]'); } catch { return []; }
}
function setCart(cart) {
  sessionStorage.setItem('jerseylab_cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('cart_updated'));
}

export default function QuickAddModal({ shirt, open, onClose }) {
  const [step, setStep] = useState('size');
  const [selectedSize, setSelectedSize] = useState('');
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

  const hasLocalStockForSize = !!(selectedSize && shirt?.local_stock_sizes && Number(shirt.local_stock_sizes[selectedSize]) > 0);
  const buyingExact = hasLocalStockForSize && buyMode === 'exact';

  const flow = [
    'size',
    ...(hasLocalStockForSize ? ['exactOrCustom'] : []),
    ...(buyingExact ? [] : ['shirtType', 'addName', ...(addName === 'yes' ? ['nameDetails'] : [])]),
    'summary',
  ];
  const currentIndex = flow.indexOf(step);
  const stepLabels = [
    'מידה',
    ...(hasLocalStockForSize ? ['בחירה'] : []),
    ...(buyingExact ? [] : ['סוג חולצה', 'הדפסה', ...(addName === 'yes' ? ['שם ומספר'] : [])]),
    'סיכום',
  ];

  const reset = () => {
    setStep('size'); setSelectedSize(''); setShirtType(''); setAddName(''); setCustomName(''); setCustomNumber(''); setBuyMode(''); setAdded(false);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleAddNameChange = (val) => {
    setAddName(val);
    if (val !== 'yes') { setCustomName(''); setCustomNumber(''); }
  };

  const canProceed = () => {
    if (step === 'size') return !!selectedSize;
    if (step === 'exactOrCustom') return !!buyMode;
    if (step === 'shirtType') return !!shirtType;
    if (step === 'addName') return addName !== '';
    if (step === 'nameDetails') return !!(customName.trim() && customNumber.trim());
    return true;
  };

  const goNext = () => { if (!canProceed()) return; const idx = flow.indexOf(step); setStep(flow[idx + 1]); };
  const goBack = () => { const idx = flow.indexOf(step); setStep(flow[idx - 1]); };

  const handleAdd = () => {
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
    setAdded(true);
    setTimeout(() => handleClose(), 1200);
  };

  if (!shirt) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md text-right">
        <DialogTitle className="sr-only">הוספה לסל — {shirt.name}</DialogTitle>

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
              <h3 className="font-heading font-bold text-lg text-[#1B2A4A] mb-1">בוא נתאים לך את החולצה</h3>
              <p className="text-sm text-gray-500 font-body mb-4">איזו מידה הכי מתאימה לך?</p>
              <SizeSelector shirt={shirt} value={selectedSize} onChange={(s) => { setSelectedSize(s); setBuyMode(''); }} />
            </motion.div>
          )}
          {step === 'exactOrCustom' && (
            <motion.div key="exactOrCustom" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <h3 className="font-heading font-bold text-lg text-[#1B2A4A] mb-1">יש לנו את זו במלאי בארץ!</h3>
              <p className="text-sm text-gray-500 font-body mb-4">רוצה לקנות בדיוק את הפריט שקיים, או להזמין גרסה משלך?</p>
              <ExactOrCustomChoice shirt={shirt} value={buyMode} onChange={setBuyMode} />
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
            </motion.div>
          )}
          {step === 'nameDetails' && (
            <motion.div key="nameDetails" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <h3 className="font-heading font-bold text-lg text-[#1B2A4A] mb-1">איזה שם ומספר תרצה?</h3>
              <p className="text-sm text-gray-500 font-body mb-4">הקלד את השם והמספר להדפסה</p>
              <NameNumberInput customName={customName} customNumber={customNumber}
                onChange={(field, val) => field === 'customName' ? setCustomName(val) : setCustomNumber(val)} />
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
          {step !== 'size' && !added && (
            <button onClick={goBack} className="flex items-center gap-1 px-4 py-3 border-2 border-[#1B2A4A] text-[#1B2A4A] text-sm font-heading font-bold uppercase hover:bg-[#F2ECD9] transition-colors">
              <ChevronLeft className="w-4 h-4" /> חזור
            </button>
          )}
          {!added && step !== 'summary' && (
            <button onClick={goNext} disabled={!canProceed()}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-[#1B2A4A] text-white text-sm font-heading font-bold uppercase hover:bg-[#2a3f6b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              המשך <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {!added && step === 'summary' && (
            <button onClick={handleAdd} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#E8622A] text-white text-sm font-heading font-bold uppercase hover:bg-[#D0551F] transition-colors" style={{ boxShadow: '3px 3px 0 #1B2A4A' }}>
              <ShoppingCart className="w-4 h-4" /> הוספה לסל
            </button>
          )}
          {added && (
            <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white text-sm font-heading font-bold uppercase">
              <Check className="w-4 h-4" /> נוסף לסל!
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}