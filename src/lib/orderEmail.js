import { supabase } from '@/lib/supabase';
import { cartItemTotal } from '@/lib/cart';

// Calls the `send-order-confirmation` Edge Function, which holds the Resend API
// key server-side — the browser must never see it. Callers treat this as
// best-effort: the order row is already written by the time we get here, so a
// mail failure should never surface as a failed checkout.
export async function sendOrderConfirmation({ email, fullName, orderId, items, total }) {
  const { error } = await supabase.functions.invoke('send-order-confirmation', {
    body: {
      email,
      full_name: fullName,
      order_id: orderId,
      total,
      items: (items || []).map(item => ({
        name: item.shirtName,
        size: item.size,
        player_version: !!item.playerVersion,
        custom_name: item.addName ? (item.customName || '') : '',
        local_stock: !!item.isExactStockItem,
        // Must go through the shared helper: items that price themselves (the
        // mystery box, whose add-ons are +10/+5) would otherwise be mailed a
        // total that disagrees with the one the customer just confirmed.
        price: cartItemTotal(item),
        notes: (item.details || []).map(d => `${d.label}: ${d.value}`).join(' | '),
      })),
    },
  });
  if (error) throw error;
}
