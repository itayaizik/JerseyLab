// What a review looks like to a shopper, once the admin has had their say.
//
// A photo can be hidden without being deleted (supabase/review_admin_edit.sql),
// so nothing on the site reads `image_url` directly: it asks here, and gets
// the empty string when the owner has turned that picture off.

export const reviewPhoto = (review) => (review?.image_hidden ? '' : review?.image_url || '');
