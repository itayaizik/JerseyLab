// Coupon codes: checking one, and pricing the cart with it.
//
// The rules live in the coupons_raw table, which only the admin can read. The
// cart asks check_coupon() about the one code the customer typed and gets back
// just what it needs to price the order (supabase/coupons.sql).
//
// There is no payment on the site, so the discount is written into the order
// itself: each discounted item's final price goes down by its share, and the
// item says which code did it. The admin panel, the emails and the sales report
// all read that final price, so they agree without knowing coupons exist.

import { supabase } from '@/lib/supabase';
import { cartItemTotal } from '@/lib/cart';
import { MYSTERY_BOX_ID } from '@/lib/mysteryBox';
import { t } from '@/lib/i18n';

export const normalizeCode = (code) => String(code ?? '').trim().toUpperCase().replace(/\s+/g, '');

const REASONS = {
  not_found: () => t('הקוד לא קיים או שכבר לא בתוקף', "This code doesn't exist or is no longer active"),
  not_started: () => t('הקוד עוד לא פעיל', "This code isn't active yet"),
  expired: () => t('תוקף הקוד פג', 'This code has expired'),
  used_up: () => t('הקוד כבר נוצל עד הסוף', 'This code has been fully used'),
  already_used: () => t('כבר השתמשתם בקוד הזה', "You've already used this code"),
  unavailable: () => t('לא הצלחנו לבדוק את הקוד. נסו שוב בעוד רגע.', "We couldn't check the code. Please try again in a moment."),
};
export const couponReason = (reason) => (REASONS[reason] || REASONS.not_found)();

// { ok: true, coupon } or { ok: false, message }.
export async function checkCoupon(code, { email, phone } = {}) {
  const normalized = normalizeCode(code);
  if (!normalized) return { ok: false, message: couponReason('not_found') };
  const { data, error } = await supabase.rpc('check_coupon', {
    p_code: normalized, p_email: email || null, p_phone: phone || null,
  });
  if (error) return { ok: false, message: couponReason('unavailable') };
  if (!data?.ok) return { ok: false, message: couponReason(data?.reason) };
  return { ok: true, coupon: data };
}

// Best effort: the order is already saved when this runs.
export function redeemCoupon({ code, orderId, email, phone, discount }) {
  return supabase.rpc('redeem_coupon', {
    p_code: code, p_order_id: orderId, p_email: email, p_phone: phone, p_discount: discount,
  });
}

const isMystery = (item) => item?.shirtId === MYSTERY_BOX_ID;

function eligible(item, coupon) {
  if (coupon.applies_to === 'mystery' && !isMystery(item)) return false;
  if (coupon.applies_to === 'shirts' && isMystery(item)) return false;
  if (coupon.exclude_sale_items && item.onSale) return false;
  return true;
}

const shekels = (n) => `₪${Number(n)}`;

// What the coupon does to this cart:
// { discount, items, message } - `items` is the cart with the discount written
// into each item's price, `message` says why there is no discount when there
// is none.
export function applyCoupon(cart, coupon) {
  const items = cart || [];
  if (!coupon) return { discount: 0, items, message: '' };

  const indexes = items.map((item, i) => (eligible(item, coupon) ? i : -1)).filter(i => i >= 0);
  const subtotal = indexes.reduce((sum, i) => sum + cartItemTotal(items[i]), 0);
  const scope = coupon.applies_to === 'mystery'
    ? t('מיסטרי בוקסים', 'Mystery Boxes')
    : coupon.applies_to === 'shirts' ? t('חולצות', 'shirts') : t('פריטים', 'items');

  if (!indexes.length) {
    return { discount: 0, items, message: coupon.applies_to === 'mystery'
      ? t('הקוד תקף רק למיסטרי בוקס', 'This code is for Mystery Boxes only')
      : coupon.applies_to === 'shirts'
        ? t('הקוד תקף רק לחולצות מהקטלוג', 'This code is for catalog shirts only')
        : t('הקוד לא חל על פריטים שכבר במבצע', "This code doesn't apply to items already on sale") };
  }
  const minItems = Number(coupon.min_items) || 0;
  if (indexes.length < minItems) {
    const more = minItems - indexes.length;
    return { discount: 0, items, message: t(`הקוד פועל מ-${minItems} ${scope} ומעלה. הוסיפו עוד ${more}.`, `This code needs at least ${minItems} ${scope}. Add ${more} more.`) };
  }
  const minTotal = Number(coupon.min_total) || 0;
  if (subtotal < minTotal) {
    return { discount: 0, items, message: t(`הקוד פועל בהזמנה מעל ${shekels(minTotal)}. חסרים ${shekels(minTotal - subtotal)}.`, `This code needs an order over ${shekels(minTotal)}. ${shekels(minTotal - subtotal)} to go.`) };
  }

  const value = Number(coupon.discount_value) || 0;
  let discount = coupon.discount_type === 'fixed' ? value : Math.round(subtotal * value / 100);
  if (coupon.discount_type === 'percent' && coupon.max_discount) discount = Math.min(discount, Number(coupon.max_discount));
  discount = Math.max(0, Math.min(Math.round(discount), subtotal));
  if (!discount) return { discount: 0, items, message: '' };

  // Each item's share, in whole shekels, with what rounding leaves over going
  // to the last one, so the shares add up to the discount exactly.
  const shares = new Map();
  let given = 0;
  indexes.forEach((i, n) => {
    const share = n === indexes.length - 1
      ? discount - given
      : Math.floor(discount * cartItemTotal(items[i]) / subtotal);
    shares.set(i, share);
    given += share;
  });

  const priced = items.map((item, i) => {
    const share = shares.get(i);
    if (!share) return item;
    return {
      ...item,
      unitPrice: cartItemTotal(item) - share,
      details: [...(item.details || []), {
        label: 'קופון', labelEn: 'Coupon',
        value: `${coupon.code} (-₪${share})`,
      }],
    };
  });
  return { discount, items: priced, message: '' };
}
