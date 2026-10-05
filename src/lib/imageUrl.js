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
//
// `format=webp` is asked for rather than left to the server. Storage will pick
// WebP on its own from the browser's Accept header - but it answers the same
// URL with WebP or JPEG depending on who asks, and sends no `Vary: Accept` with
// a year-long cache header. Any shared cache in between - a school or office
// proxy is the usual one - is then free to keep whichever variant it saw first
// and hand it to everyone. Naming the format means one URL is one picture, for
// every visitor and every cache.
//
// Quality 74 rather than 82: at the sizes a card actually paints, the two are
// indistinguishable side by side, and the file is about a quarter smaller. On a
// page carrying sixty-odd thumbnails that is most of a megabyte.
export function resized(url, width, { quality = 74, resize = 'contain', format = 'webp' } = {}) {
  if (!isOurStorage(url)) return url;
  const base = `${url.replace(STORAGE_OBJECT, STORAGE_RENDER)}?width=${width}&resize=${resize}&quality=${quality}`;
  return format ? `${base}&format=${format}` : base;
}

// A srcset for a picture that is painted at different sizes on different
// screens. Returns undefined for anything we cannot resize, which is what an
// <img> wants in that case.
export function srcSetFor(url, widths) {
  if (!isOurStorage(url)) return undefined;
  return widths.map(w => `${resized(url, w)} ${w}w`).join(', ');
}
