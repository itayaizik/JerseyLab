// Review requests: the personal link a customer gets after their order, where
// they rate what they bought and add a photo, without an account
// (supabase/review_invites.sql).

import { supabase } from '@/lib/supabase';
import { base44 } from '@/api/base44Client';
import { SITE_ORIGIN } from '@/lib/siteUrl';
import { t } from '@/lib/i18n';

export const reviewPath = (inviteId) => `/review/${inviteId}`;
export const reviewLink = (inviteId) => `${SITE_ORIGIN}${reviewPath(inviteId)}`;

const REASONS = {
  not_found: () => t('הקישור לא נמצא. בקשו מאיתנו קישור חדש.', "This link wasn't found. Ask us for a new one."),
  used: () => t('כבר שלחתם ביקורת דרך הקישור הזה. תודה!', "You've already sent a review through this link. Thank you!"),
  expired: () => t('הקישור הזה כבר לא בתוקף. בקשו מאיתנו קישור חדש.', 'This link has expired. Ask us for a new one.'),
  empty: () => t('צריך לדרג ולכתוב כמה מילים על לפחות פריט אחד.', 'Please rate and write a few words about at least one item.'),
  unavailable: () => t('משהו השתבש. נסו שוב בעוד רגע.', 'Something went wrong. Please try again in a moment.'),
};
export const inviteReason = (reason) => (REASONS[reason] || REASONS.unavailable)();

async function call(fn, args) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error || !data) return { ok: false, message: inviteReason('unavailable') };
  if (!data.ok) return { ok: false, reason: data.reason, message: inviteReason(data.reason) };
  return data;
}

export const fetchInvite = (inviteId) => call('get_review_invite', { p_id: inviteId });

export const submitInvite = (inviteId, { name, anonymous, reviews }) =>
  call('submit_review_invite', { p_id: inviteId, p_name: name, p_anonymous: anonymous, p_reviews: reviews });

export const uploadInvitePhoto = async (inviteId, file) => {
  const { file_url } = await base44.integrations.Core.UploadFile({ file, bucket: 'review-images', folder: `invites/${inviteId}` });
  return file_url;
};

// --- the admin side ---------------------------------------------------------

// The invite for an order, created the first time it is asked for.
export async function inviteForOrder(orderKey, fullName) {
  const existing = await base44.entities.ReviewInvite.filter({ order_id: orderKey }, '-created_date', 1);
  if (existing[0]) return existing[0];
  return base44.entities.ReviewInvite.create({ order_id: orderKey, full_name: fullName || '' });
}

export function reviewRequestText({ fullName, inviteId }) {
  const firstName = (fullName || '').trim().split(/\s+/)[0];
  return [
    `היי${firstName ? ` ${firstName}` : ''}, כאן JerseyLab 👋`,
    'מקווים שההזמנה הגיעה ושאתם נהנים ממנה!',
    'נשמח מאוד לביקורת קצרה, ואם אפשר גם תמונה עם החולצה - זה עוזר לנו המון 🙏',
    'לוקח דקה, בלי הרשמה:',
    reviewLink(inviteId),
  ].join('\n');
}
