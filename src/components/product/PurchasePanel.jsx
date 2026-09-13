import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, Info, Pencil, ShoppingBag, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SizeSelector from '@/components/configurator/SizeSelector';
import ExactOrCustomChoice from '@/components/configurator/ExactOrCustomChoice';
import NameNumberInput from '@/components/configurator/NameNumberInput';
import { SHIRT_TYPE_OPTIONS } from '@/components/configurator/ShirtTypeChoice';
import TagBadge from '@/components/ui/TagBadge';
import ProductImage from '@/components/ui/ProductImage';
import TrustBar from '@/components/TrustBar';
import { hasLocalStock, hasLocalStockForSize } from '@/components/ShippingBadge';
import { itemsForSize, stockPrint } from '@/lib/localStock';
import { addToCart, openCart, shirtBasePrice, EXTRA_PRICES, PATCHES_LABEL } from '@/lib/cart';
import { allowsPlayerVersion, allowsPatches } from '@/lib/shirtOptions';
import { BUSINESS, isPlaceholder } from '@/lib/business';

// Everything needed to buy the shirt, in one card beside the photos: size,
// version, name and number, and the button. It used to be a single "אני מעוניין"
// button that opened a step-by-step window asking the same questions one at a
// time; laid out together, the customer sees every choice and its price at once
// and can change any of them without walking back through the steps.

function Section({ id, title, aside, sectionRef, className = '', children }) {
  return (
    <section ref={sectionRef} aria-labelledby={id} className={`mt-6 border-t border-brand-line pt-6 ${className}`}>
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <h2 id={id} className="text-[15px] font-semibold text-brand-navy">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function shirtTags(shirt) {
  const tags = [];
  if (hasLocalStock(shirt)) tags.push('מלאי בארץ');
  if (shirt.sale_price && shirt.sale_price < shirt.price) tags.push('סייל');
  if (shirt.is_retro) tags.push('רטרו');
  if (shirt.is_rare) tags.push('נדיר');
  if (shirt.limited_stock) tags.push('מלאי מוגבל');
  return tags;
}

export default function PurchasePanel({ shirt, siblings = [], attention = 0, onOpenSizeGuide, ctaRef }) {
  const [size, setSize] = useState('');
  const [buyMode, setBuyMode] = useState(''); // '' | 'exact' | 'custom'
  const [stockItemId, setStockItemId] = useState('');
  const [shirtType, setShirtType] = useState('regular');
  const [printing, setPrinting] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [patches, setPatches] = useState(false);
  const [errors, setErrors] = useState({});
  const [added, setAdded] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const sizeRef = useRef(null);
  const printRef = useRef(null);

  // A different shirt is a fresh start.
  useEffect(() => {
    setSize(''); setBuyMode(''); setStockItemId(''); setShirtType('regular');
    setPrinting(false); setCustomName(''); setCustomNumber(''); setPatches(false); setErrors({}); setAdded(false);
  }, [shirt.id]);

  // Asked for from outside - the sticky bar on a phone, or a link that arrives
  // with ?interest=true - by bringing the size choice into view.
  useEffect(() => {
    if (!attention) return;
    sizeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlight(true);
    const timer = setTimeout(() => setHighlight(false), 1600);
    return () => clearTimeout(timer);
  }, [attention]);

  const basePrice = shirtBasePrice(shirt);
  const onSale = shirt.sale_price && shirt.sale_price < shirt.price;
  const available = shirt.status === 'available';

  // A size with shirts physically in Israel offers those shirts as they are,
  // next to ordering one made up. Legacy rows can mark a size as stocked
  // without listing the shirts; there is nothing to choose between then.
  const stockItems = size && hasLocalStockForSize(shirt, size) ? itemsForSize(shirt, size) : [];
  const needsStockChoice = stockItems.length > 0;
  const buyingExact = needsStockChoice && buyMode === 'exact';
  const stockItem = buyingExact ? stockItems.find(item => item.id === stockItemId) || null : null;

  // Israeli league shirts have no player version or patches, retro shirts no
  // player version. Checked again here, not only by hiding the choice, so a
  // choice made before switching shirts cannot slip into the price or the cart.
  const playerAllowed = allowsPlayerVersion(shirt);
  const patchesAllowed = allowsPatches(shirt);
  const wantsPlayer = playerAllowed && shirtType === 'player';
  const wantsPatches = patchesAllowed && patches;

  const extras = buyingExact
    ? (stockItem?.player_version ? EXTRA_PRICES.player : 0) + (stockPrint(stockItem) ? EXTRA_PRICES.name : 0)
    : (wantsPlayer ? EXTRA_PRICES.player : 0) + (printing ? EXTRA_PRICES.name : 0) + (wantsPatches ? EXTRA_PRICES.patches : 0);
  const total = basePrice + extras;

  const freeAbove = BUSINESS.shipping?.freeAbove;
  const showFreeShipping = freeAbove && !isPlaceholder(freeAbove);

  const clearError = (key) => setErrors(e => ({ ...e, [key]: undefined }));

  const chooseSize = (next) => {
    setSize(next);
    setBuyMode('');
    setStockItemId('');
    setErrors(e => ({ ...e, size: undefined, buyMode: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!size) errs.size = 'בחרו מידה';
    else if (needsStockChoice && (!buyMode || (buyMode === 'exact' && !stockItem))) errs.buyMode = 'בחרו איך תרצו לקבל את החולצה';
    if (!buyingExact && printing && (!customName.trim() || !customNumber.trim())) errs.print = 'מלאו שם ומספר להדפסה, או בחרו "ללא"';
    return errs;
  };

  const handleAdd = () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      const target = errs.size || errs.buyMode ? sizeRef.current : printRef.current;
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    addToCart({
      shirtId: shirt.id, shirtName: shirt.name, image: shirt.main_image,
      size, basePrice,
      addName: buyingExact ? !!stockPrint(stockItem) : printing,
      customName: buyingExact ? stockPrint(stockItem) : (printing ? `${customName} ${customNumber}`.trim() : ''),
      playerVersion: buyingExact ? !!stockItem?.player_version : wantsPlayer,
      // A shirt already in stock is finished as it is.
      patches: buyingExact ? false : wantsPatches,
      localStockSizes: shirt.local_stock_sizes || {},
      isExactStockItem: buyingExact,
      // Which physical shirt, so the order says which of two size S shirts
      // with different prints the customer chose.
      stockItemId: buyingExact ? stockItem?.id || '' : '',
    });
    base44.entities.Shirt.update(shirt.id, { interest_count: (shirt.interest_count || 0) + 1 }).catch(() => {});
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2500);
  };

  const tags = shirtTags(shirt);
  const meta = [shirt.club || shirt.national_team, shirt.league, shirt.season, shirt.player_name].filter(Boolean).join(' · ');
  const team = shirt.club || shirt.national_team;
  const deliveryLine = buyingExact
    ? 'החולצה שבמלאי מגיעה עד שבוע, או באיסוף מקריית אונו.'
    : 'הזמנה מיוחדת מגיעה עד 3 שבועות.';

  return (
    <div className="shop-card p-5 sm:p-8">
      {tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map(tag => <TagBadge key={tag} tag={tag} />)}
        </div>
      )}

      <h1 className="text-[1.625rem] font-bold leading-[1.15] tracking-[-0.02em] text-brand-navy sm:text-[2rem]">{shirt.name}</h1>
      {meta && <p className="mt-2 text-[15px] text-brand-navy/55">{meta}</p>}

      <div className="mt-5 flex items-baseline gap-3">
        <span className="text-[1.75rem] font-semibold tabular-nums text-brand-navy">₪{basePrice}</span>
        {onSale && <span className="text-lg tabular-nums text-brand-navy/40 line-through">₪{shirt.price}</span>}
      </div>
      {showFreeShipping && (
        <p className="mt-1 text-sm font-medium text-brand-orange-ink">משלוח חינם בהזמנה מעל {freeAbove}</p>
      )}

      {siblings.length > 0 && team && (
        <Section id="siblings-heading" title={`עוד חולצות של ${team}`}>
          <ul className="flex flex-wrap gap-2.5">
            <li>
              <span aria-current="true" title={shirt.name}
                className="relative block h-16 w-16 overflow-hidden rounded-xl bg-brand-mist ring-2 ring-brand-orange ring-offset-2">
                <ProductImage src={shirt.main_image} alt={shirt.name} sizes="64px" className="h-full w-full object-cover" />
              </span>
            </li>
            {siblings.slice(0, 5).map(s => (
              <li key={s.id}>
                <Link to={`/shirt/${s.id}`} title={s.name}
                  className="relative block h-16 w-16 overflow-hidden rounded-xl bg-brand-mist ring-1 ring-brand-line transition hover:ring-2 hover:ring-brand-navy/40">
                  <ProductImage src={s.main_image} alt={s.name} sizes="64px" className="h-full w-full object-cover" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        id="size-heading"
        sectionRef={sizeRef}
        className={`rounded-sm transition-shadow duration-500 ${highlight ? 'shadow-[0_0_0_6px_var(--brand-orange-soft)]' : ''}`}
        title={size ? <>מידה: <span dir="ltr" className="font-normal text-brand-navy/60">{size}</span></> : 'מידה'}
        aside={(
          <button type="button" onClick={() => onOpenSizeGuide?.(wantsPlayer && !buyingExact ? 'player' : null)} className="shop-link text-sm">
            מדריך מידות
          </button>
        )}
      >
        <SizeSelector shirt={shirt} value={size} onChange={chooseSize} invalid={!!errors.size} />
        {errors.size && <p role="alert" className="mt-2 text-sm font-medium text-red-600">{errors.size}</p>}
      </Section>

      {needsStockChoice && (
        <Section id="stock-heading" title="איך תרצו לקבל אותה?">
          <p className="-mt-1.5 mb-3 text-[13px] text-brand-navy/55">
            {stockItems.length > 1
              ? 'יש אצלנו כמה חולצות במידה הזו. אפשר לקנות אחת מהן כמו שהיא, או להזמין גרסה משלכם.'
              : 'אפשר לקנות את החולצה שכבר נמצאת בארץ, או להזמין גרסה משלכם.'}
          </p>
          <ExactOrCustomChoice
            items={stockItems}
            value={buyMode}
            itemId={stockItemId}
            invalid={!!errors.buyMode}
            onChange={(mode, id) => { setBuyMode(mode); setStockItemId(id || ''); clearError('buyMode'); }}
          />
          {errors.buyMode && <p role="alert" className="mt-2 text-sm font-medium text-red-600">{errors.buyMode}</p>}
        </Section>
      )}

      {!buyingExact && (
        <>
          {playerAllowed && (
          <Section id="version-heading" title="גרסה">
            <div role="group" aria-labelledby="version-heading" className="flex flex-wrap gap-2">
              {SHIRT_TYPE_OPTIONS.map(opt => (
                <button key={opt.id} type="button" aria-pressed={shirtType === opt.id} onClick={() => setShirtType(opt.id)}
                  className={`shop-chip px-5 ${shirtType === opt.id ? 'shop-chip-active' : ''}`}>
                  {opt.label}
                  {opt.price > 0 && <span className="tabular-nums">+₪{opt.price}</span>}
                  {opt.id === 'player' && <Star className="h-4 w-4" aria-hidden="true" />}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[13px] text-brand-navy/55">{SHIRT_TYPE_OPTIONS.find(o => o.id === shirtType)?.desc}</p>
          </Section>
          )}

          <Section id="print-heading" title="שם ומספר" sectionRef={printRef}>
            <div role="group" aria-labelledby="print-heading" className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={!printing} onClick={() => { setPrinting(false); clearError('print'); }}
                className={`shop-chip px-5 ${!printing ? 'shop-chip-active' : ''}`}>
                ללא
              </button>
              <button type="button" aria-pressed={printing} onClick={() => setPrinting(true)}
                className={`shop-chip px-5 ${printing ? 'shop-chip-active' : ''}`}>
                הדפסה אישית
                <span className="tabular-nums">+₪{EXTRA_PRICES.name}</span>
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {printing && (
              <div className="mt-4">
                <NameNumberInput
                  customName={customName}
                  customNumber={customNumber}
                  invalid={!!errors.print}
                  onChange={(field, val) => { if (field === 'customName') setCustomName(val); else setCustomNumber(val); clearError('print'); }}
                />
                <p className="mt-2 text-[13px] text-brand-navy/55">באותיות לועזיות, כמו שיודפס על הגב.</p>
                {errors.print && <p role="alert" className="mt-1.5 text-sm font-medium text-red-600">{errors.print}</p>}
              </div>
            )}
          </Section>

          {patchesAllowed && (
          <Section id="patches-heading" title={PATCHES_LABEL}>
            <div role="group" aria-labelledby="patches-heading" className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={!patches} onClick={() => setPatches(false)}
                className={`shop-chip px-5 ${!patches ? 'shop-chip-active' : ''}`}>
                ללא
              </button>
              <button type="button" aria-pressed={patches} onClick={() => setPatches(true)}
                className={`shop-chip px-5 ${patches ? 'shop-chip-active' : ''}`}>
                {`${PATCHES_LABEL} של הליגה`}
                <span className="tabular-nums">+₪{EXTRA_PRICES.patches}</span>
              </button>
            </div>
            <p className="mt-2.5 text-[13px] text-brand-navy/55">{`ה${PATCHES_LABEL} של הליגה או הטורניר, לפי החולצה.`}</p>
          </Section>
          )}
        </>
      )}

      <div ref={ctaRef} className="mt-6 border-t border-brand-line pt-6">
        {extras > 0 && (
          <div className="mb-4 flex items-baseline justify-between">
            <span className="text-[15px] text-brand-navy/60">סה״כ עם התוספות</span>
            <span className="text-xl font-semibold tabular-nums text-brand-navy">₪{total}</span>
          </div>
        )}

        {available ? (
          <button type="button" onClick={handleAdd} className="shop-btn min-h-[3.75rem] w-full text-base">
            {added
              ? <><Check className="h-5 w-5" aria-hidden="true" />נוספה לסל</>
              : <><ShoppingBag className="h-5 w-5" aria-hidden="true" />הוספה לסל</>}
          </button>
        ) : (
          <>
            <button type="button" disabled className="shop-btn min-h-[3.75rem] w-full text-base">
              {shirt.status === 'reserved' ? 'החולצה שמורה כרגע' : 'החולצה לא זמינה כרגע'}
            </button>
            <Link to="/request-shirt" className="shop-btn-secondary mt-3 w-full">בקשו חולצה דומה</Link>
          </>
        )}
        <span className="sr-only" aria-live="polite">{added ? 'החולצה נוספה לסל' : ''}</span>

        <p className="mt-4 flex items-start gap-2.5 text-[13px] leading-relaxed text-brand-navy/60">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{deliveryLine} באתר לא מתבצע תשלום: אחרי שליחת ההזמנה נחזור אליכם בוואטסאפ או באינסטגרם לאישור הפרטים.</span>
        </p>

        <TrustBar className="mt-5" />
      </div>
    </div>
  );
}
