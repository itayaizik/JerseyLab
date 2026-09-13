import { sizeQty } from '@/lib/sizes';

// Whether a shirt, or one size of it, is physically in Israel.
//
// The badge this file was named for is gone - the product card and the purchase
// card now say it in their own words - but these two questions are asked all
// over the shop, from the catalogue filter to the admin list.

export function hasLocalStock(shirt) {
  const sizes = shirt?.local_stock_sizes;
  if (!sizes || typeof sizes !== 'object') return false;
  return Object.values(sizes).some(q => Number(q) > 0);
}

export function hasLocalStockForSize(shirt, size) {
  if (!size) return hasLocalStock(shirt);
  // sizeQty, not a direct lookup: stock for this size may be filed under 'XXL'
  // while the selector hands us '2XL' (or the other way round).
  return sizeQty(shirt?.local_stock_sizes, size) > 0;
}
