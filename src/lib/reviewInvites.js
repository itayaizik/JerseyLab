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

// Finding your own link from /review, for a customer holding the card that
// came in the box rather than a message from us. The phone and the email must
// both belong to the same order (supabase/review_lookup.sql).
const START_REASONS = {
  not_found: () => t('לא מצאנו הזמנה עם הטלפון והאימייל האלה. בדקו שהם כתובים בדיוק כמו בהזמנה.',
                     "We couldn't find an order with that phone and email. Check they're exactly as you gave them."),
  used: () => t('כבר שלחתם לנו ביקורת על ההזמנה הזאת. תודה!', "You've already sent us a review for this order. Thank you!"),
  unavailable: () => t('משהו השתבש. נסו שוב בעוד רגע.', 'Something went wrong. Please try again in a moment.'),
};

// A review left straight from the card in the box: stars and a few words are
// all that is required, and the order details only decide whether it counts as
// a verified purchase (supabase/open_reviews.sql).
const OPEN_REASONS = {
  rating_required: () => t('בחרו כמה כוכבים.', 'Choose a rating.'),
  comment_required: () => t('כתבו כמה מילים על ההזמנה.', 'Write a few words about your order.'),
  busy: () => t('קיבלנו הרבה ביקורות ברגע זה. נסו שוב בעוד דקה.', 'We are getting a lot of reviews right now. Try again in a minute.'),
  unavailable: () => t('משהו השתבש. נסו שוב בעוד רגע.', 'Something went wrong. Please try again in a moment.'),
};

export async function submitOpenReview({ rating, comment, name, anonymous, bought, shirtId, imageUrl, phone, email }) {
  const { data, error } = await supabase.rpc('submit_open_review', {
    p_rating: rating,
    p_comment: comment,
    p_name: name || null,
    p_anonymous: !!anonymous,
    p_bought: bought || null,
    p_shirt_id: shirtId || null,
    p_image_url: imageUrl || null,
    p_phone: phone || null,
    p_email: email || null,
  });
  if (error || !data) return { ok: false, message: OPEN_REASONS.unavailable() };
  if (!data.ok) return { ok: false, message: (OPEN_REASONS[data.reason] || OPEN_REASONS.unavailable)() };
  return data;
}

// The photos for those reviews live in their own folder, which is the one
// anyone may upload to.
export const uploadOpenPhoto = async (file) => {
  const { file_url } = await base44.integrations.Core.UploadFile({ file, bucket: 'review-images', folder: 'open' });
  return file_url;
};

export async function startReview({ phone, email }) {
  const { data, error } = await supabase.rpc('start_review', { p_phone: phone, p_email: email });
  if (error || !data) return { ok: false, message: START_REASONS.unavailable() };
  if (!data.ok) return { ok: false, message: (START_REASONS[data.reason] || START_REASONS.not_found)() };
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
