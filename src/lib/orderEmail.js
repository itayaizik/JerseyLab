import { supabase } from '@/lib/supabase';
import { cartItemTotal } from '@/lib/cart';

// Calls the `send-order-confirmation` Edge Function, which holds the Resend API
// key server-side - the browser must never see it. Callers treat this as
// best-effort: the order row is already written by the time we get here, so a
// mail failure should never surface as a failed checkout.
export async function sendOrderConfirmation({ email, fullName, orderId, items, total, discount = 0, couponCode = '' }) {
  const { error } = await supabase.functions.invoke('send-order-confirmation', {
    body: {
      email,
      full_name: fullName,
      order_id: orderId,
      total,
      discount,
      coupon_code: couponCode,
      items: (items || []).map(item => ({
        name: item.shirtName,
        size: item.size,
        player_version: !!item.playerVersion,
        custom_name: item.addName ? (item.customName || '') : '',
        patches: !!item.patches,
        long_sleeve: !!item.longSleeve,
        shorts: !!item.shorts,
        local_stock: !!item.isExactStockItem,
        // Must go through the shared helper: items that price themselves (the
        // mystery box, whose add-ons are +10/+5) would otherwise be mailed a
        // total that disagrees with the one the customer just confirmed.
        price: cartItemTotal(item),
        details: (item.details || []).map(d => ({ label: d.label, value: d.value })),
      })),
    },
  });
  if (error) throw error;
}

// Tells a customer their order was changed from the admin panel. Calls the
// `send-order-update` Edge Function, which only sends for a signed-in admin -
// supabase-js passes the admin's session along with the call. Unlike the
// confirmation this one is awaited: the admin pressed a button and should see
// whether the mail went.
export async function sendOrderUpdate({ email, fullName, orderId, changes, items, total }) {
  const { error } = await supabase.functions.invoke('send-order-update', {
    body: { email, full_name: fullName, order_id: orderId, changes, items, total },
  });
  if (error) throw error;
}
