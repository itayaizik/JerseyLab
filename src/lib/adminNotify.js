import { supabase } from '@/lib/supabase';
import { cartItemTotal } from '@/lib/cart';

// Tells the shop owner that something came in. Calls the `notify-admin` Edge
// Function, which holds the Resend key server-side.
//
// Every caller treats this as best-effort and never awaits it in a way that can
// fail a submission: the row is already written by the time we get here, so a
// mail outage must not read to the customer as a failed order.
async function notify(payload) {
  const { error } = await supabase.functions.invoke('notify-admin', { body: payload });
  if (error) throw error;
}

function channelLabel(channel) {
  return channel === 'instagram' ? 'אינסטגרם' : 'וואטסאפ';
}

export function notifyNewOrder({ orderId, fullName, phone, email, channel, instagramHandle, items, total }) {
  const list = (items || [])
    .map(item => {
      const extras = [];
      if (item.playerVersion) extras.push('גרסת שחקן');
      if (item.addName) extras.push(`הדפסה: ${item.customName || ''}`);
      (item.extras || []).forEach(x => extras.push(x.label));
      (item.details || []).forEach(d => extras.push(`${d.label}: ${d.value}`));
      const suffix = extras.length ? ` (${extras.join(', ')})` : '';
      return `• ${item.shirtName} - מידה ${item.size} - ₪${cartItemTotal(item)}${suffix}`;
    })
    .join('\n');

  return notify({
    kind: 'order',
    title: `${fullName} - ${items?.length || 0} פריטים, ₪${total}`,
    reference: orderId ? `#${String(orderId).slice(-6).toUpperCase()}` : '',
    reply_to: email || '',
    fields: [
      { label: 'שם', value: fullName },
      { label: 'טלפון', value: phone },
      { label: 'אימייל', value: email },
      { label: 'לחזור ב', value: channelLabel(channel) },
      { label: 'אינסטגרם', value: instagramHandle ? `@${instagramHandle}` : '' },
      { label: 'סה"כ', value: `₪${total}` },
    ],
    body: list,
  }).catch(() => {});
}

export function notifyNewEnquiry({ name, email, phone, subject, message }) {
  return notify({
    kind: 'enquiry',
    title: subject?.trim() ? `${name} - ${subject}` : name,
    reply_to: email || '',
    fields: [
      { label: 'שם', value: name },
      { label: 'אימייל', value: email },
      { label: 'טלפון', value: phone },
      { label: 'נושא', value: subject },
    ],
    body: message,
  }).catch(() => {});
}

// A customer asking for a shirt the catalogue does not carry. Takes the same
// snake_case row the page writes to the database, so there is one spelling of
// these fields rather than two that can drift apart. The photo URL goes in as
// its own field: it is the part the owner needs to look at before answering.
export function notifyShirtRequest(request) {
  const headline = [request.club, request.season].filter(Boolean).join(' ')
    || (request.shirt_description || '').slice(0, 60)
    || 'ללא תיאור';

  return notify({
    kind: 'enquiry',
    title: `${request.full_name} מחפש: ${headline}`,
    fields: [
      { label: 'שם', value: request.full_name },
      { label: 'טלפון', value: request.phone },
      { label: 'אימייל', value: request.email },
      { label: 'לחזור ב', value: channelLabel(request.contact_channel) },
      { label: 'אינסטגרם', value: request.instagram_handle ? `@${request.instagram_handle}` : '' },
      { label: 'קבוצה', value: request.club },
      { label: 'עונה', value: request.season },
      { label: 'מידה', value: request.wanted_size },
      { label: 'תמונה', value: request.image_url },
    ],
    reply_to: request.email || '',
    body: [request.shirt_description, request.notes && `הערות: ${request.notes}`]
      .filter(Boolean)
      .join('\n\n'),
  }).catch(() => {});
}
