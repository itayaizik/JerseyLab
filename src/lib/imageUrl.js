// Asking our storage for an image at the size it will actually be painted.
//
// Supabase serves transformed copies from /render/image/ instead of /object/,
// and picks WebP by itself for a browser that says it takes one. The saving is
// not marginal: a 2.3MB catalogue PNG comes back 24KB at the width a card
// paints it.
//
// The product cards have done this since the migration (components/ui/
// ProductImage). The pictures around them - club crests, category cards,
// league badges, Instagram photos, chat screenshots - did not, and a phone was
// downloading several megabytes of full-size artwork to paint tiles a few
// hundred pixels wide.

const STORAGE_OBJECT = '/storage/v1/object/public/';
const STORAGE_RENDER = '/storage/v1/render/image/public/';

export const isOurStorage = (url) =>
  typeof url === 'string' && url.includes(STORAGE_OBJECT) && url.includes('.supabase.co');

// `resize=contain` keeps the proportions: asking for a width alone leaves the
// height at the original and paints the picture stretched.
export function resized(url, width, { quality = 82, resize = 'contain' } = {}) {
  if (!isOurStorage(url)) return url;
  return `${url.replace(STORAGE_OBJECT, STORAGE_RENDER)}?width=${width}&resize=${resize}&quality=${quality}`;
}

// A srcset for a picture that is painted at different sizes on different
// screens. Returns undefined for anything we cannot resize, which is what an
// <img> wants in that case.
export function srcSetFor(url, widths) {
  if (!isOurStorage(url)) return undefined;
  return widths.map(w => `${resized(url, w)} ${w}w`).join(', ');
}
