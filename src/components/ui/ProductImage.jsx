import React, { useState } from 'react';

const FALLBACK = 'https://placehold.co/400x400/f0f0f0/ccc?text=JersyLab';

/**
 * Product image with safe performance optimizations:
 * - decoding="async" and lazy loading by default (eager for above-the-fold)
 * - skeleton placeholder while loading
 * - fallback placeholder on error
 * Parent container should be `relative` with a fixed aspect ratio.
 */
export default function ProductImage({ src, alt = '', className = '', eager = false, fallback = FALLBACK }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <>
      {!loaded && <div className="absolute inset-0 skeleton" />}
      <img
        src={errored || !src ? fallback : src}
        alt={alt}
        decoding="async"
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        sizes="(max-width: 768px) 50vw, 25vw"
        onLoad={() => setLoaded(true)}
        onError={() => { setErrored(true); setLoaded(true); }}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
}