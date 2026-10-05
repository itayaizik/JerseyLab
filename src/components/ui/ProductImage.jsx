import React, { useState, useRef, useEffect } from 'react';
import { isOurStorage, resized } from '@/lib/imageUrl';

// Drawn here rather than fetched. The fallback used to be a placehold.co URL,
// which meant the picture shown when the network failed was itself a network
// request - to a third-party host, on a connection that had just proven itself
// unreliable, and one more domain for a school or office filter to block. An
// inline SVG cannot fail.
const FALLBACK = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">'
  + '<rect width="80" height="80" fill="%23F3F5F8"/>'
  + '<path d="M28 27l6-3a7 7 0 0 0 12 0l6 3 4 9-6 3v16H30V39l-6-3z" fill="none" stroke="%231B2A4A" stroke-opacity=".22" stroke-width="2.5" stroke-linejoin="round"/>'
  + '</svg>',
).replace(/%2523/g, '%23')}`;

// A dropped request is not a missing picture. Mobile networks drop them all the
// time - a tab waking up, a lift, school wifi - and the browser does not try
// again on its own: the <img> stays blank until the page is reloaded. So a
// failure is retried a couple of times, a moment apart, before the fallback is
// accepted as the answer.
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 900;

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

// A transformed copy at a given width.
//
// `resize=contain` is not optional. Asking for a width on its own leaves the
// height at the original: a 1000x1000 photo came back 200x1000, which would
// have painted every product stretched to four times its height. `contain`
// fits the picture inside the requested box and keeps its proportions, for
// square and non-square sources alike.
//
// The quality and the format are decided in lib/imageUrl, which every picture
// on the site goes through, not only these.
const atWidth = (url, width) => resized(url, width);

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
  // Bumped on a failed load to make the browser ask again; it will not refetch
  // a URL it has already given up on.
  const [retry, setRetry] = useState(0);
  const timer = useRef(null);

  // A new picture starts its own attempts, and a pending retry for the old one
  // must not land on it.
  useEffect(() => {
    setLoaded(false);
    setErrored(false);
    setRetry(0);
    return () => clearTimeout(timer.current);
  }, [src]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleError = () => {
    if (retry < MAX_RETRIES) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setRetry(n => n + 1), RETRY_DELAY_MS);
      return;
    }
    setErrored(true);
    setLoaded(true);
  };

  const resolved = errored || !src ? fallback : src;
  const resizable = !errored && isOurStorage(resolved);
  // Only from the first retry on, so the ordinary path keeps a cacheable URL.
  const bust = retry > 0 && !errored ? `&r=${retry}` : '';

  const srcSet = resizable
    ? WIDTHS.map(w => `${atWidth(resolved, w)}${bust} ${w}w`).join(', ')
    : undefined;

  return (
    <>
      {/* Sits behind the picture and disappears with it, so an image that fails
          to load still leaves a styled surface rather than a white hole. */}
      {!loaded && (
        <div className="absolute inset-0 skeleton" aria-hidden="true" style={{ aspectRatio: ratio }} />
      )}
      <img
        src={resizable ? `${atWidth(resolved, 640)}${bust}` : resolved}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        decoding="async"
        loading={eager ? 'eager' : 'lazy'}
        fetchpriority={eager ? 'high' : 'low'}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ aspectRatio: ratio, ...style }}
      />
    </>
  );
}
