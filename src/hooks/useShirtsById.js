import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// The shirts behind a list of ids, as a map.
//
// Reviews and chat proofs both say what someone bought, and both know it only
// as an id. The entity filter matches on equality, not on "one of these", so
// the rows are fetched one by one the way the wishlist does it - deduplicated
// first, so ten reviews of the same shirt are one request.
//
// A shirt that has since been deleted or hidden simply stays out of the map,
// and every caller treats a missing shirt as "no row to show" rather than as
// an error: a review of a sold-out shirt is still a review.

export default function useShirtsById(ids) {
  const [shirts, setShirts] = useState({});
  // The identity of an array literal changes on every render, so the effect
  // keys off the ids themselves rather than the array holding them.
  const key = [...new Set(ids.filter(Boolean))].sort().join(',');

  useEffect(() => {
    if (!key) { setShirts({}); return undefined; }
    let cancelled = false;
    Promise.all(key.split(',').map(id => base44.entities.Shirt.get(id).catch(() => null)))
      .then(found => {
        if (cancelled) return;
        setShirts(Object.fromEntries(found.filter(Boolean).map(s => [s.id, s])));
      });
    return () => { cancelled = true; };
  }, [key]);

  return shirts;
}
