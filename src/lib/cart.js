// The cart lives in sessionStorage and is read by the navbar badge, the cart
// modal and the quick-add modal. Those grew their own copies of these helpers;
// this is the shared one, and the only place that knows how an item is priced.

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

// Items built by the shirt configurator price their extras with the fixed
// +15/+20 below. Anything that prices itself differently - the mystery box,
// whose add-ons are +10 and +5 - carries `unitPrice` and wins.
export function cartItemTotal(item) {
  if (typeof item?.unitPrice === 'number') return item.unitPrice;
  return (item?.basePrice || 0) + (item?.addName ? 15 : 0) + (item?.playerVersion ? 20 : 0);
}

export function cartTotal(cart) {
  return (cart || []).reduce((sum, item) => sum + cartItemTotal(item), 0);
}
