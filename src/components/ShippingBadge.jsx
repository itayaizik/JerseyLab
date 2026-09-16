import { sizeQty } from '@/lib/sizes';

// Whether a shirt, or one size of it, is physically in Israel.
//
// The badge this file was named for is gone - the product card and the purchase
// card now say it in their own words - but these two questions are asked all
// over the shop, from the catalogue filter to the admin list.

// Whether the shop shows local stock to customers at all. Off: the owner
// found "מלאי בארץ" made the shop look less professional, so every shirt is
// sold as an ordinary order - no badge, no filter, no green dot and no choice
// of the shirt already in stock. The admin still keeps and shows the stock;
// switching this back on restores all of it.
export const LOCAL_STOCK_ON_SITE = false;

// The storefront's questions. The admin asks hasLocalStock directly.
export const showsLocalStock = (shirt) => LOCAL_STOCK_ON_SITE && hasLocalStock(shirt);
export const showsLocalStockForSize = (shirt, size) => LOCAL_STOCK_ON_SITE && hasLocalStockForSize(shirt, size);

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
