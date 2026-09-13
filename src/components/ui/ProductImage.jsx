import React, { useState } from 'react';

const FALLBACK = 'https://placehold.co/400x400/EDE8D9/9aa3b2?text=JerseyLab';

// Product images used to live on nine third-party hosts, none of which could
// resize on request, so a 1000px file was downloaded to paint a 150px card.
// They now sit in our own Supabase storage, which can, and this component asks
// for the size it actually needs.
//
// Supabase serves transformed copies from /render/image/ instead of /object/.
// The saving is not marginal: a catalogue photo that is 110 KB at full size is
// 36 KB at the width a card actually paints it.
//
// Anything not in our storage is passed through untouched. Nothing in the
// catalogue is, as of the migration, but the check stays: a URL we do not
// control is one we cannot ask to resize, and rewriting it would only break it.
//
// The rest of what this component does is about when images arrive rather than
// how big they are:
//
//   1. Layout shift. The box reserves its space through an aspect ratio, so the
//      page does not jump each time a picture lands.
//   2. Everything at once. Only images marked `eager` (above the fold) get
//      priority; the rest wait until they are near the viewport.
//   3. Decode blocking. `decoding="async"` keeps a large JPEG from stalling the
//      main thread while it is unpacked.

const STORAGE_OBJECT = '/storage/v1/object/public/';
const STORAGE_RENDER = '/storage/v1/render/image/public/';

// The widths worth generating: thumbnails at 64px through to the product page
// hero on a high-density screen, which needs far more than a card does.
const WIDTHS = [160, 320, 480, 640, 900, 1280, 1600];

// What the image measures on screen, per place it is used.
//
// This is not decoration. `sizes` is how the browser decides which candidate to
// download, and every caller was using the card figure because it was the
// default: the large product image was being told it was 300px wide, so the
// browser fetched a 400px file and stretched it across a box twice that,
// through a zoom that goes to 150% on top. That is the softness, not the
// compression. Thumbnails had the opposite problem, fetching a card-sized file
// to paint 64 pixels.
export const IMAGE_SIZES = {
  card: '(min-width: 1280px) 360px, (min-width: 768px) 32vw, 50vw',
  // The first card of a collection, which spans two columns and two rows.
  featured: '(min-width: 1280px) 740px, (min-width: 768px) 64vw, 100vw',
  // Deliberately generous: the hero can be zoomed, and the browser will not
  // fetch a larger file when it is, so the headroom has to be there first.
  hero: '(min-width: 1280px) 900px, (min-width: 1024px) 56vw, 100vw',
  thumb: '64px',
};

function isOurStorage(url) {
  return typeof url === 'string' && url.includes(STORAGE_OBJECT) && url.includes('.supabase.co');
}

// A transformed copy at a given width.
//
// `resize=contain` is not optional. Asking for a width on its own leaves the
// height at the original: a 1000x1000 photo came back 200x1000, which would
// have painted every product stretched to four times its height. `contain`
// fits the picture inside the requested box and keeps its proportions, for
// square and non-square sources alike.
//
// Quality 82 rather than 75. On a plain photograph the two are hard to tell
// apart, but these are shirts: crests, sponsor lettering and fabric texture are
// exactly the detail that low quality smears first, and 75 was visibly soft on
// them. The extra weight is small next to serving the right dimensions.
function atWidth(url, width) {
  return `${url.replace(STORAGE_OBJECT, STORAGE_RENDER)}?width=${width}&resize=contain&quality=82`;
}

export default function ProductImage({
  src,
  alt = '',
  className = '',
  eager = false,
  fallback = FALLBACK,
  style,
  ratio = '1 / 1',
  // What the image measures on screen, for the browser to pick a source with.
  // Only meaningful alongside a srcset, which is why it is ignored for images
  // we cannot resize.
  sizes = IMAGE_SIZES.card,
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const resolved = errored || !src ? fallback : src;
  const resizable = !errored && isOurStorage(resolved);

  const srcSet = resizable
    ? WIDTHS.map(w => `${atWidth(resolved, w)} ${w}w`).join(', ')
    : undefined;

  return (
    <>
      {/* Sits behind the picture and disappears with it, so an image that fails
          to load still leaves a styled surface rather than a white hole. */}
      {!loaded && (
        <div className="absolute inset-0 skeleton" aria-hidden="true" style={{ aspectRatio: ratio }} />
      )}
      <img
        src={resizable ? atWidth(resolved, 640) : resolved}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        decoding="async"
        loading={eager ? 'eager' : 'lazy'}
        fetchpriority={eager ? 'high' : 'low'}
        onLoad={() => setLoaded(true)}
        onError={() => { setErrored(true); setLoaded(true); }}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ aspectRatio: ratio, ...style }}
      />
    </>
  );
}
