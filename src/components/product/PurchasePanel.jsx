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
import { showsLocalStock, showsLocalStockForSize } from '@/components/ShippingBadge';
import { itemsForSize, stockPrint } from '@/lib/localStock';
import { addToCart, openCart, shirtBasePrice, EXTRA_PRICES, PATCHES_LABEL, LONG_SLEEVE_LABEL, SHORTS_LABEL } from '@/lib/cart';
import { allowsPlayerVersion, allowsPatches, allowsLongSleeve, allowsShorts } from '@/lib/shirtOptions';
import { BUSINESS, isPlaceholder } from '@/lib/business';
import { t } from '@/lib/i18n';
import { term, shirtName, shirtNameEn } from '@/lib/english';

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

// Hebrew keys: TagBadge picks each one's colour by them and shows them in the
// site's language.
function shirtTags(shirt) {
  const tags = [];
  if (showsLocalStock(shirt)) tags.push('מלאי בארץ');
  if (shirt.sale_price && shirt.sale_price < shirt.price) tags.push('סייל');
  if (shirt.is_retro) tags.push('רטרו');
  if (shirt.is_rare) tags.push('נדיר');
  if (shirt.limited_stock) tags.push('מלאי מוגבל');
  return tags;
}

const LONG_SLEEVE_TEXT = t(LONG_SLEEVE_LABEL, 'Long sleeve');
const SHORTS_TEXT = t(SHORTS_LABEL, 'Shorts');
const PATCHES_TEXT = t(PATCHES_LABEL, 'Patches');

export default function PurchasePanel({ shirt, siblings = [], attention = 0, onOpenSizeGuide, ctaRef }) {
  const [size, setSize] = useState('');
  const [buyMode, setBuyMode] = useState(''); // '' | 'exact' | 'custom'
  const [stockItemId, setStockItemId] = useState('');
  const [shirtType, setShirtType] = useState('regular');
  const [printing, setPrinting] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [patches, setPatches] = useState(false);
  const [longSleeve, setLongSleeve] = useState(false);
  const [shorts, setShorts] = useState(false);
  const [errors, setErrors] = useState({});
  const [added, setAdded] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const sizeRef = useRef(null);
  const printRef = useRef(null);

  // A different shirt is a fresh start.
  useEffect(() => {
    setSize(''); setBuyMode(''); setStockItemId(''); setShirtType('regular');
    setPrinting(false); setCustomName(''); setCustomNumber(''); setPatches(false);
    setLongSleeve(false); setShorts(false); setErrors({}); setAdded(false);
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
  const name = shirtName(shirt);

  // A size with shirts physically in Israel offers those shirts as they are,
  // next to ordering one made up. Legacy rows can mark a size as stocked
  // without listing the shirts; there is nothing to choose between then.
  const stockItems = size && showsLocalStockForSize(shirt, size) ? itemsForSize(shirt, size) : [];
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

  // Long sleeves: not on Israeli league shirts. Matching shorts: not on Israeli
  // league shirts or retro. Both are made to order, so neither applies to a
  // shirt bought as it is from stock.
  const longSleeveAllowed = allowsLongSleeve(shirt);
  const shortsAllowed = allowsShorts(shirt);
  const wantsLongSleeve = longSleeveAllowed && !buyingExact && longSleeve;
  const wantsShorts = shortsAllowed && !buyingExact && shorts;

  const extras = buyingExact
    ? (stockItem?.player_version ? EXTRA_PRICES.player : 0) + (stockPrint(stockItem) ? EXTRA_PRICES.name : 0) + (wantsPatches ? EXTRA_PRICES.patches : 0)
    : (wantsPlayer ? EXTRA_PRICES.player : 0) + (printing ? EXTRA_PRICES.name : 0) + (wantsPatches ? EXTRA_PRICES.patches : 0)
      + (wantsLongSleeve ? EXTRA_PRICES.longSleeve : 0) + (wantsShorts ? EXTRA_PRICES.shorts : 0);
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
    if (!size) errs.size = t('בחרו מידה', 'Choose a size');
    else if (needsStockChoice && (!buyMode || (buyMode === 'exact' && !stockItem))) errs.buyMode = t('בחרו איך תרצו לקבל את החולצה', 'Choose how you would like the shirt');
    if (!buyingExact && printing && (!customName.trim() || !customNumber.trim())) errs.print = t('מלאו שם ומספר להדפסה, או בחרו "ללא"', 'Fill in a name and number to print, or choose "None"');
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
      // The Hebrew name goes into the order; the English one is for the cart.
      shirtId: shirt.id, shirtName: shirt.name, shirtNameEn: shirtNameEn(shirt), image: shirt.main_image,
      size, basePrice,
      addName: buyingExact ? !!stockPrint(stockItem) : printing,
      customName: buyingExact ? stockPrint(stockItem) : (printing ? `${customName} ${customNumber}`.trim() : ''),
      playerVersion: buyingExact ? !!stockItem?.player_version : wantsPlayer,
      // Patches can go on a shirt already in stock as well.
      patches: wantsPatches,
      longSleeve: wantsLongSleeve,
      shorts: wantsShorts,
      // Coupons that do not stack with a sale leave this item out.
      onSale: Number(shirt.sale_price) > 0 && Number(shirt.sale_price) < Number(shirt.price),
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
  const team = term(shirt.club || shirt.national_team);
  const meta = [team, term(shirt.league), shirt.season, shirt.player_name].filter(Boolean).join(' · ');
  const deliveryLine = buyingExact
    ? t('החולצה שבמלאי מגיעה עד שבוע, או באיסוף מקריית אונו.', 'The shirt in stock arrives within a week, or you can pick it up in Kiryat Ono.')
    : t('הזמנה מיוחדת מגיעה עד 3 שבועות.', 'A made-to-order shirt arrives within 3 weeks.');

  return (
    <div className="shop-card p-5 sm:p-8">
      {tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map(tag => <TagBadge key={tag} tag={tag} />)}
        </div>
      )}

      <h1 className="text-[1.625rem] font-bold leading-[1.15] tracking-[-0.02em] text-brand-navy sm:text-[2rem]">{name}</h1>
      {meta && <p className="mt-2 text-[15px] text-brand-navy/55">{meta}</p>}

      <div className="mt-5 flex items-baseline gap-3">
        <span className="text-[1.75rem] font-semibold tabular-nums text-brand-navy">₪{basePrice}</span>
        {onSale && <span className="text-lg tabular-nums text-brand-navy/40 line-through">₪{shirt.price}</span>}
      </div>
      {showFreeShipping && (
        <p className="mt-1 text-sm font-medium text-brand-orange-ink">{t(`משלוח חינם בהזמנה מעל ${freeAbove}`, `Free shipping on orders over ${freeAbove}`)}</p>
      )}

      {siblings.length > 0 && team && (
        <Section id="siblings-heading" title={t(`עוד חולצות של ${team}`, `More ${team} shirts`)}>
          <ul className="flex flex-wrap gap-2.5">
            <li>
              <span aria-current="true" title={name}
                className="relative block h-16 w-16 overflow-hidden rounded-xl bg-brand-mist ring-2 ring-brand-orange ring-offset-2">
                <ProductImage src={shirt.main_image} alt={name} sizes="64px" className="h-full w-full object-cover" />
              </span>
            </li>
            {siblings.slice(0, 5).map(s => (
              <li key={s.id}>
                <Link to={`/shirt/${s.id}`} title={shirtName(s)}
                  className="relative block h-16 w-16 overflow-hidden rounded-xl bg-brand-mist ring-1 ring-brand-line transition hover:ring-2 hover:ring-brand-navy/40">
                  <ProductImage src={s.main_image} alt={shirtName(s)} sizes="64px" className="h-full w-full object-cover" />
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
        title={size ? <>{t('מידה:', 'Size:')} <span dir="ltr" className="font-normal text-brand-navy/60">{size}</span></> : t('מידה', 'Size')}
        aside={(
          <button type="button" onClick={() => onOpenSizeGuide?.(wantsPlayer && !buyingExact ? 'player' : null)} className="shop-link text-sm">
            {t('מדריך מידות', 'Size guide')}
          </button>
        )}
      >
        <SizeSelector shirt={shirt} value={size} onChange={chooseSize} invalid={!!errors.size} />
        {errors.size && <p role="alert" className="mt-2 text-sm font-medium text-red-600">{errors.size}</p>}
      </Section>

      {needsStockChoice && (
        <Section id="stock-heading" title={t('איך תרצו לקבל אותה?', 'How would you like it?')}>
          <p className="-mt-1.5 mb-3 text-[13px] text-brand-navy/55">
            {stockItems.length > 1
              ? t('יש אצלנו כמה חולצות במידה הזו. אפשר לקנות אחת מהן כמו שהיא, או להזמין גרסה משלכם.', 'We have several shirts in this size. Buy one of them as it is, or order your own version.')
              : t('אפשר לקנות את החולצה שכבר נמצאת בארץ, או להזמין גרסה משלכם.', 'Buy the shirt that is already in Israel, or order your own version.')}
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
          <Section id="version-heading" title={t('גרסה', 'Version')}>
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

          <Section id="print-heading" title={t('שם ומספר', 'Name and number')} sectionRef={printRef}>
            <div role="group" aria-labelledby="print-heading" className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={!printing} onClick={() => { setPrinting(false); clearError('print'); }}
                className={`shop-chip px-5 ${!printing ? 'shop-chip-active' : ''}`}>
                {t('ללא', 'None')}
              </button>
              <button type="button" aria-pressed={printing} onClick={() => setPrinting(true)}
                className={`shop-chip px-5 ${printing ? 'shop-chip-active' : ''}`}>
                {t('הדפסה אישית', 'Custom print')}
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
                <p className="mt-2 text-[13px] text-brand-navy/55">{t('באותיות לועזיות, כמו שיודפס על הגב.', 'In English letters, as it will be printed on the back.')}</p>
                {errors.print && <p role="alert" className="mt-1.5 text-sm font-medium text-red-600">{errors.print}</p>}
              </div>
            )}
          </Section>

          {(longSleeveAllowed || shortsAllowed) && (
          <Section id="extras-heading" title={t('שרוול ומכנס', 'Sleeves and shorts')}>
            <div role="group" aria-labelledby="extras-heading" className="flex flex-wrap gap-2">
              {longSleeveAllowed && (
                <button type="button" aria-pressed={longSleeve} onClick={() => setLongSleeve(v => !v)}
                  className={`shop-chip px-5 ${longSleeve ? 'shop-chip-active' : ''}`}>
                  {LONG_SLEEVE_TEXT}
                  <span className="tabular-nums">+₪{EXTRA_PRICES.longSleeve}</span>
                </button>
              )}
              {shortsAllowed && (
                <button type="button" aria-pressed={shorts} onClick={() => setShorts(v => !v)}
                  className={`shop-chip px-5 ${shorts ? 'shop-chip-active' : ''}`}>
                  {SHORTS_TEXT}
                  <span className="tabular-nums">+₪{EXTRA_PRICES.shorts}</span>
                </button>
              )}
            </div>
            <p className="mt-2.5 text-[13px] text-brand-navy/55">
              {shortsAllowed
                ? t(`אפשר לבחור אחד, שניים או אף אחד. ה${SHORTS_LABEL} של אותה חולצה, באותה מידה שבחרתם.`, 'Choose one, both or neither. The shorts match this shirt, in the size you chose.')
                : t(`אותה חולצה, בגרסת ${LONG_SLEEVE_LABEL}.`, 'The same shirt, with long sleeves.')}
            </p>
          </Section>
          )}

        </>
      )}

      {/* Outside the made-to-order choices: patches can be added to a shirt
          already in stock too. */}
      {patchesAllowed && (
          <Section id="patches-heading" title={PATCHES_TEXT}>
            <div role="group" aria-labelledby="patches-heading" className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={!patches} onClick={() => setPatches(false)}
                className={`shop-chip px-5 ${!patches ? 'shop-chip-active' : ''}`}>
                {t('ללא', 'None')}
              </button>
              <button type="button" aria-pressed={patches} onClick={() => setPatches(true)}
                className={`shop-chip px-5 ${patches ? 'shop-chip-active' : ''}`}>
                {t(`${PATCHES_LABEL} של הליגה`, 'League patches')}
                <span className="tabular-nums">+₪{EXTRA_PRICES.patches}</span>
              </button>
            </div>
            <p className="mt-2.5 text-[13px] text-brand-navy/55">{t(`ה${PATCHES_LABEL} של הליגה או הטורניר, לפי החולצה.`, 'The league or tournament patches, to match the shirt.')}</p>
          </Section>
      )}

      <div ref={ctaRef} className="mt-6 border-t border-brand-line pt-6">
        {extras > 0 && (
          <div className="mb-4 flex items-baseline justify-between">
            <span className="text-[15px] text-brand-navy/60">{t('סה״כ עם התוספות', 'Total with extras')}</span>
            <span className="text-xl font-semibold tabular-nums text-brand-navy">₪{total}</span>
          </div>
        )}

        {available ? (
          <button type="button" onClick={handleAdd} className="shop-btn min-h-[3.75rem] w-full text-base">
            {added
              ? <><Check className="h-5 w-5" aria-hidden="true" />{t('נוספה לסל', 'Added to cart')}</>
              : <><ShoppingBag className="h-5 w-5" aria-hidden="true" />{t('הוספה לסל', 'Add to cart')}</>}
          </button>
        ) : (
          <>
            <button type="button" disabled className="shop-btn min-h-[3.75rem] w-full text-base">
              {shirt.status === 'reserved' ? t('החולצה שמורה כרגע', 'This shirt is reserved right now') : t('החולצה לא זמינה כרגע', 'This shirt is not available right now')}
            </button>
            <Link to="/request-shirt" className="shop-btn-secondary mt-3 w-full">{t('בקשו חולצה דומה', 'Request a similar shirt')}</Link>
          </>
        )}
        <span className="sr-only" aria-live="polite">{added ? t('החולצה נוספה לסל', 'The shirt was added to your cart') : ''}</span>

        <p className="mt-4 flex items-start gap-2.5 text-[13px] leading-relaxed text-brand-navy/60">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>
            {deliveryLine}{' '}
            {t('באתר לא מתבצע תשלום: אחרי שליחת ההזמנה נחזור אליכם בוואטסאפ או באינסטגרם לאישור הפרטים.',
              "Nothing is charged on the site: after you send your order we'll get back to you on WhatsApp or Instagram to confirm the details.")}
          </span>
        </p>

        <TrustBar className="mt-5" />
      </div>
    </div>
  );
}
