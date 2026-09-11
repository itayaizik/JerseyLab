import React, { useState } from 'react';

const FALLBACK = 'https://placehold.co/400x400/EDE8D9/9aa3b2?text=JerseyLab';

// Product images live on seven different third-party hosts (ibb.co, postimg.cc,
// base44.app, and a few shop sites), none of which can resize on request. So a
// 1000px file was being downloaded to paint a 150px card, with a `sizes`
// attribute that did nothing because there was no `srcset` to select from.
//
// This cannot resize what the hosts will not resize, but it fixes the three
// things that actually cause the visible stutter:
//
//   1. Layout shift. The box now reserves its space through an aspect ratio, so
//      the page does not jump each time a picture arrives.
//   2. Everything loading at once. Only images marked `eager` (above the fold)
//      get priority; the rest wait until they are near the viewport.
//   3. Decode blocking. `decoding="async"` keeps a large JPEG from stalling the
//      main thread while it is unpacked.
//
// The real fix for the file sizes is to move the images onto storage the shop
// controls; see the note in scripts/out/image-audit.md.

export default function ProductImage({
  src,
  alt = '',
  className = '',
  eager = false,
  fallback = FALLBACK,
  style,
  ratio = '1 / 1',
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const resolved = errored || !src ? fallback : src;

  return (
    <>
      {/* Sits behind the picture and disappears with it, so an image that fails
          to load still leaves a styled surface rather than a white hole. */}
      {!loaded && (
        <div className="absolute inset-0 skeleton" aria-hidden="true" style={{ aspectRatio: ratio }} />
      )}
      <img
        src={resolved}
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
