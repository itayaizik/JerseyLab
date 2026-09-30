// What a mystery box costs less when you order several.
//
// A tier is a discount off whatever the box's own style costs, not a price of
// its own (supabase/mystery_pricing.sql): one ladder governs every style, and
// a retro box stays dearer than a regular one at every quantity.
//
// The ladder ships flat - one tier, nothing off - so the shop reads exactly as
// it did until the owner fills in numbers from ניהול > מיסטרי בוקס. Every
// caller here works the same whether there are tiers or not, which is what
// lets the rest of the page be written once.

import { base44 } from '@/api/base44Client';

// Sorted low to high, which is what `discountFor` walks.
export async function fetchTiers() {
  try {
    const rows = await base44.entities.MysteryTier.filter({ active: true }, 'min_boxes', 20);
    return normalizeTiers(rows);
  } catch {
    // A table not created yet, or a network that failed: flat pricing, and a
    // page that still sells.
    return [];
  }
}

export function normalizeTiers(rows) {
  return (rows || [])
    .map(r => ({ minBoxes: Number(r.min_boxes) || 1, discount: Math.max(0, Number(r.discount) || 0) }))
    .filter(r => r.minBoxes >= 1)
    .sort((a, b) => a.minBoxes - b.minBoxes);
}

// The discount each box earns in an order of `count` boxes: the highest tier
// whose threshold the order has reached.
export function discountFor(tiers, count) {
  let discount = 0;
  for (const tier of tiers || []) {
    if (count >= tier.minBoxes) discount = tier.discount;
    else break;
  }
  return discount;
}

// Only the tiers that actually take something off, which is all a shopper
// wants to see. A ladder of one row that gives nothing is not a ladder.
export const hasLadder = (tiers) => (tiers || []).some(t => t.discount > 0);

// The next rung: how many more boxes, and what it would save per box. Null at
// the top of the ladder, or when there is no ladder.
export function nextTier(tiers, count) {
  const now = discountFor(tiers, count);
  const next = (tiers || []).find(t => t.minBoxes > count && t.discount > now);
  if (!next) return null;
  return { boxesAway: next.minBoxes - count, minBoxes: next.minBoxes, extraPerBox: next.discount - now };
}
