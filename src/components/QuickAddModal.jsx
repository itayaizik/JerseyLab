import React, { useState } from 'react';
import { ShoppingBag, Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
import { hasLocalStockForSize } from '@/components/ShippingBadge';
import { itemsForSize, stockPrint } from '@/lib/localStock';
import { addToCart, openCart, shirtBasePrice, EXTRA_PRICES, PATCHES_LABEL, LONG_SLEEVE_LABEL, SHORTS_LABEL } from '@/lib/cart';
import { allowsPlayerVersion, allowsPatches, allowsLongSleeve, allowsShorts } from '@/lib/shirtOptions';

// Adding a shirt straight from a product card, one question at a time. The
// product page asks the same questions all at once; this is the short path for
// someone who already knows what they want.

function Tip({ children }) {
  return (
    <div className="mb-3 flex items-start gap-2 rounded-2xl bg-brand-mist p-3 text-[13px] leading-relaxed text-brand-navy/70">
      <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

const stepMotion = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
  transition: { duration: 0.2 },
};

export default function QuickAddModal({ shirt, open, onClose }) {
  const [step, setStep] = useState('size');
  const [selectedSize, setSelectedSize] = useState('');
  const [shirtType, setShirtType] = useState('');
  const [addName, setAddName] = useState('');
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [buyMode, setBuyMode] = useState(''); // '' | 'exact' | 'custom'
  const [stockItemId, setStockItemId] = useState(''); // which physical shirt, when buying exact
  const [patches, setPatches] = useState(false);
  const [longSleeve, setLongSleeve] = useState(false);
  const [shorts, setShorts] = useState(false);
  const [added, setAdded] = useState(false);

  const basePrice = shirtBasePrice(shirt);

  const sizeStockItems = selectedSize ? itemsForSize(shirt, selectedSize) : [];
  const sizeHasLocalStock = !!selectedSize && hasLocalStockForSize(shirt, selectedSize) && sizeStockItems.length > 0;
  const buyingExact = sizeHasLocalStock && buyMode === 'exact';
  const stockItem = buyingExact ? sizeStockItems.find(item => item.id === stockItemId) || null : null;

  // Israeli league shirts: no player version, no patches. Retro: no player
  // version. The version step is skipped entirely when there is only one.
  const playerAllowed = allowsPlayerVersion(shirt);
  const patchesAllowed = allowsPatches(shirt);
  const wantsPlayer = playerAllowed && shirtType === 'player';
  const wantsPatches = patchesAllowed && patches;
  // Long sleeves: not on Israeli league shirts. Shorts: not on Israeli league
  // shirts or retro. Both made to order only, never on a shirt from stock.
  const longSleeveAllowed = allowsLongSleeve(shirt) && !buyingExact;
  const shortsAllowed = allowsShorts(shirt) && !buyingExact;
  const wantsLongSleeve = longSleeveAllowed && longSleeve;
  const wantsShorts = shortsAllowed && shorts;

  const flow = [
    'size',
    ...(sizeHasLocalStock ? ['exactOrCustom'] : []),
    ...(buyingExact ? [] : [...(playerAllowed ? ['shirtType'] : []), 'addName', ...(addName === 'yes' ? ['nameDetails'] : [])]),
    'summary',
  ];
  const currentIndex = flow.indexOf(step);
  const stepLabels = [
    'מידה',
    ...(sizeHasLocalStock ? ['בחירה'] : []),
    ...(buyingExact ? [] : [...(playerAllowed ? ['גרסה'] : []), 'הדפסה', ...(addName === 'yes' ? ['שם ומספר'] : [])]),
    'סיכום',
  ];

  const reset = () => {
    setStep('size'); setSelectedSize(''); setShirtType(''); setAddName(''); setCustomName(''); setCustomNumber('');
    setBuyMode(''); setStockItemId(''); setPatches(false); setLongSleeve(false); setShorts(false); setAdded(false);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleAddNameChange = (val) => {
    setAddName(val);
    if (val !== 'yes') { setCustomName(''); setCustomNumber(''); }
  };

  const canProceed = () => {
    if (step === 'size') return !!selectedSize;
    if (step === 'exactOrCustom') return !!buyMode && (buyMode !== 'exact' || !!stockItem);
    if (step === 'shirtType') return !!shirtType;
    if (step === 'addName') return addName !== '';
    if (step === 'nameDetails') return !!(customName.trim() && customNumber.trim());
    return true;
  };

  const goNext = () => { if (!canProceed()) return; setStep(flow[flow.indexOf(step) + 1]); };
  const goBack = () => { setStep(flow[flow.indexOf(step) - 1]); };

  // Adds, confirms for a moment, then hands over to the cart drawer, so the
  // customer sees where the shirt went.
  const handleAdd = () => {
    addToCart({
      shirtId: shirt.id, shirtName: shirt.name, image: shirt.main_image,
      size: selectedSize, basePrice,
      addName: buyingExact ? !!stockPrint(stockItem) : addName === 'yes',
      customName: buyingExact ? stockPrint(stockItem) : (addName === 'yes' ? `${customName} ${customNumber}`.trim() : ''),
      playerVersion: buyingExact ? !!stockItem?.player_version : wantsPlayer,
      patches: wantsPatches,
      longSleeve: wantsLongSleeve,
      shorts: wantsShorts,
      localStockSizes: shirt.local_stock_sizes || {},
      isExactStockItem: buyingExact,
      stockItemId: buyingExact ? stockItem?.id || '' : '',
    });
    setAdded(true);
    setTimeout(() => { handleClose(); openCart(); }, 650);
  };

  // The yes-or-no extras are asked on the summary rather than as steps of their
  // own: a tick box each does not deserve another screen.
  const toggle = (key, title, hint, price, checked, onChange) => (
    <label key={key} className="mb-2 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-brand-line p-4 transition hover:border-brand-navy/30">
      <span>
        <span className="block text-[15px] font-semibold text-brand-navy">{title}</span>
        <span className="block text-[13px] text-brand-navy/55">{hint}</span>
      </span>
      <span className="flex items-center gap-3">
        <span className="text-sm font-semibold tabular-nums text-brand-navy">+₪{price}</span>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-5 w-5 accent-brand-orange" />
      </span>
    </label>
  );
  // Patches are offered for a shirt from stock as well as one made up.
  const patchesToggle = patchesAllowed && toggle('patches', `${PATCHES_LABEL} של הליגה`, 'לפי החולצה', EXTRA_PRICES.patches, patches, setPatches);
  const sleeveAndShortsToggles = (
    <>
      {longSleeveAllowed && toggle('longSleeve', LONG_SLEEVE_LABEL, 'אותה חולצה עם שרוול ארוך', EXTRA_PRICES.longSleeve, longSleeve, setLongSleeve)}
      {shortsAllowed && toggle('shorts', SHORTS_LABEL, 'של אותה חולצה, באותה מידה', EXTRA_PRICES.shorts, shorts, setShorts)}
    </>
  );

  if (!shirt) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto text-right">
        <DialogTitle className="sr-only">הוספה לסל - {shirt.name}</DialogTitle>

        <div className="mb-1 flex items-center gap-3 pe-10">
          {shirt.main_image && <img src={shirt.main_image} alt="" className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-tight text-brand-navy">{shirt.name}</p>
            <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-brand-navy/70">₪{basePrice}</p>
          </div>
        </div>

        <StepIndicator steps={stepLabels} current={currentIndex} />

        <AnimatePresence mode="wait">
          {step === 'size' && (
            <motion.div key="size" {...stepMotion}>
              <h3 className="mb-1 text-lg font-semibold text-brand-navy">איזו מידה?</h3>
              <p className="mb-4 text-sm text-brand-navy/55">בחרו את המידה שמתאימה לכם.</p>
              <SizeSelector shirt={shirt} value={selectedSize} onChange={(s) => { setSelectedSize(s); setBuyMode(''); setStockItemId(''); }} />
            </motion.div>
          )}
          {step === 'exactOrCustom' && (
            <motion.div key="exactOrCustom" {...stepMotion}>
              <h3 className="mb-1 text-lg font-semibold text-brand-navy">יש לנו את זו במלאי בארץ</h3>
              <p className="mb-4 text-sm text-brand-navy/55">
                {sizeStockItems.length > 1 ? 'יש אצלנו כמה חולצות במידה הזו. אפשר לקנות אחת מהן כמו שהיא, או להזמין גרסה משלכם.' : 'אפשר לקנות את החולצה שכבר נמצאת בארץ, או להזמין גרסה משלכם.'}
              </p>
              <ExactOrCustomChoice items={sizeStockItems} value={buyMode} itemId={stockItemId}
                onChange={(mode, id) => { setBuyMode(mode); setStockItemId(id || ''); }} />
            </motion.div>
          )}
          {step === 'shirtType' && (
            <motion.div key="shirtType" {...stepMotion}>
              <h3 className="mb-2 text-lg font-semibold text-brand-navy">איזו גרסה?</h3>
              <Tip>{getShirtTypeTip()}</Tip>
              <ShirtTypeChoice value={shirtType} onChange={setShirtType} />
            </motion.div>
          )}
          {step === 'addName' && (
            <motion.div key="addName" {...stepMotion}>
              <h3 className="mb-2 text-lg font-semibold text-brand-navy">שם ומספר על הגב?</h3>
              <Tip>{getPersonalizationTip(shirt)}</Tip>
              <PersonalizationChoice value={addName} onChange={handleAddNameChange} />
            </motion.div>
          )}
          {step === 'nameDetails' && (
            <motion.div key="nameDetails" {...stepMotion}>
              <h3 className="mb-1 text-lg font-semibold text-brand-navy">מה להדפיס?</h3>
              <p className="mb-4 text-sm text-brand-navy/55">באותיות לועזיות, כמו שיודפס על הגב.</p>
              <NameNumberInput customName={customName} customNumber={customNumber}
                onChange={(field, val) => field === 'customName' ? setCustomName(val) : setCustomNumber(val)} />
            </motion.div>
          )}
          {step === 'summary' && (
            <motion.div key="summary" {...stepMotion}>
              <h3 className="mb-4 text-lg font-semibold text-brand-navy">הכל מוכן</h3>
              {buyingExact ? (
                <>
                  {patchesToggle}
                  <OrderSummary shirt={shirt} size={selectedSize}
                    shirtType={stockItem?.player_version ? 'player' : 'regular'}
                    addName={stockPrint(stockItem) ? 'yes' : 'no'}
                    customName={stockItem?.name || ''} customNumber={stockItem?.number || ''} basePrice={basePrice}
                    patches={wantsPatches} />
                </>
              ) : (
                <>
                  {sleeveAndShortsToggles}
                  {patchesToggle}
                  <div className="mt-3">
                    <OrderSummary shirt={shirt} size={selectedSize} shirtType={wantsPlayer ? 'player' : 'regular'} addName={addName}
                      customName={customName} customNumber={customNumber} basePrice={basePrice} patches={wantsPatches}
                      longSleeve={wantsLongSleeve} shorts={wantsShorts} />
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5 flex gap-2">
          {step !== 'size' && !added && (
            <button type="button" onClick={goBack} className="shop-btn-secondary px-4">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              חזרה
            </button>
          )}
          {!added && step !== 'summary' && (
            <button type="button" onClick={goNext} disabled={!canProceed()} className="shop-btn-dark flex-1">
              המשך
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {!added && step === 'summary' && (
            <button type="button" onClick={handleAdd} className="shop-btn flex-1">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              הוספה לסל
            </button>
          )}
          {added && (
            <div role="status" className="flex min-h-[3.25rem] flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-[15px] font-semibold text-white">
              <Check className="h-4 w-4" aria-hidden="true" />
              נוספה לסל
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
