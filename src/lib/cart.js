// The cart lives in sessionStorage and is read by the navbar badge, the cart
// drawer, the product page and the quick-add window. Those grew their own copies
// of these helpers; this is the shared one, and the only place that knows how an
// item is priced.

const CART_KEY = 'jerseylab_cart';

export function getCart() {
  try { return JSON.parse(sessionStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}

export function setCart(cart) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cart_updated'));
}

export function addToCart(item) {
  const cart = getCart();
  cart.push(item);
  setCart(cart);
  return cart;
}

// Opens the cart drawer from anywhere. The drawer belongs to the header, which
// is on every page, so a product page that has just added a shirt asks for it
// rather than mounting a second copy of its own.
export function openCart() {
  window.dispatchEvent(new Event('open_cart'));
}

// What the configurator charges for each extra.
export const EXTRA_PRICES = { name: 15, player: 20, patches: 5, longSleeve: 20, shorts: 40 };

// One spelling of the word, with a plain apostrophe: order messages are parsed
// back by the admin (supplier text, order editing), so it must not drift into
// the Hebrew geresh in one place and the apostrophe in another.
export const PATCHES_LABEL = "פאצ'ים";
export const LONG_SLEEVE_LABEL = 'שרוול ארוך';
// Matching shorts, in the same size as the shirt.
export const SHORTS_LABEL = 'מכנס קצר';

// What a shirt costs before extras.
//
// Retro shirts are never under ₪80 and new ones never under ₪70. This rule was
// written out separately in two modals while the product page and the cards
// printed the stored price, so a retro shirt stored at 70 read ₪70 everywhere
// the customer looked and more in the cart. Everything that shows a price reads
// it from here now.
export function shirtBasePrice(shirt) {
  if (!shirt) return 0;
  const price = Number(shirt.sale_price) || Number(shirt.price) || 0;
  if (shirt.is_retro) return Math.max(price, 80);
  if (shirt.is_new || shirt.condition === 'new') return Math.max(price, 70);
  return price;
}

// Items built by the shirt configurator price their extras with the fixed
// prices above. Anything that prices itself differently - the mystery box,
// whose add-ons are +10 and +5 - carries `unitPrice` and wins.
export function cartItemTotal(item) {
  if (typeof item?.unitPrice === 'number') return item.unitPrice;
  return (item?.basePrice || 0)
    + (item?.addName ? EXTRA_PRICES.name : 0)
    + (item?.playerVersion ? EXTRA_PRICES.player : 0)
    + (item?.patches ? EXTRA_PRICES.patches : 0)
    + (item?.longSleeve ? EXTRA_PRICES.longSleeve : 0)
    + (item?.shorts ? EXTRA_PRICES.shorts : 0);
}

export function cartTotal(cart) {
  return (cart || []).reduce((sum, item) => sum + cartItemTotal(item), 0);
}
