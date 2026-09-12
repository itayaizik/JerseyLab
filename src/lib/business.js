// Every legal detail about the business, in one place.
//
// Israeli consumer law treats a web shop as a distance-selling transaction
// (עסקת מכר מרחוק), which obliges the seller to publish their full name, their
// ID or company number and their address. The accessibility regulations
// separately oblige a named accessibility coordinator with direct contact
// details. Those are facts about the business that only the owner can supply,
// so they live here as one list rather than being scattered through six legal
// pages.
//
// Anything still reading TODO is shown to visitors as "יעודכן בקרוב" rather
// than as an empty gap, and is listed for the owner to fill in.

import { SHOP_PHONE, SHOP_PHONE_E164, INSTAGRAM_HANDLE } from '@/lib/contact';

export const BUSINESS = {
  // Trading name shown to customers.
  tradingName: 'JerseyLab',

  // The legal name the business is registered under. For an עוסק פטור/מורשה
  // this is usually the owner's full name.
  legalName: 'TODO_LEGAL_NAME',

  // Whether the shop is registered with the tax authority yet.
  //
  // Anyone trading as a business in Israel has to register; עוסק פטור is the
  // free, online, below-threshold form of it. Until that happens there is no
  // dealer number in existence, so the pages drop the row rather than printing
  // "יעודכן בקרוב" against it: an omission reads as a detail not yet added, a
  // placeholder reads as a number being withheld, and the second is worse.
  //
  // Flip this to true and fill the two fields below on the day the
  // registration comes through. All six legal pages follow on their own.
  registered: false,

  // ח.פ for a company, ע.מ for a licensed dealer, ת.ז for an exempt dealer.
  registrationType: 'TODO_REGISTRATION_TYPE',
  registrationNumber: 'TODO_REGISTRATION_NUMBER',

  // Required by the Consumer Protection Law for distance selling. A business
  // run from home may publish a postal box instead of a home address.
  address: 'TODO_ADDRESS',

  phone: SHOP_PHONE,
  phoneE164: SHOP_PHONE_E164,
  email: 'TODO_CONTACT_EMAIL',
  instagram: INSTAGRAM_HANDLE,

  // The accessibility regulations require a named person who can be reached
  // directly about accessibility problems.
  accessibilityCoordinator: {
    name: 'TODO_ACCESSIBILITY_COORDINATOR_NAME',
    phone: SHOP_PHONE,
    email: 'TODO_ACCESSIBILITY_EMAIL',
  },

  // Shown on the shipping policy. Change these and the page follows.
  shipping: {
    localStockDays: 'עד 7 ימי עסקים',
    specialOrderWeeks: 'עד 3 שבועות',
    pickupLocation: 'קריית אונו',
    carrier: 'TODO_SHIPPING_CARRIER',
    price: 'TODO_SHIPPING_PRICE',
    freeAbove: 'TODO_FREE_SHIPPING_THRESHOLD',
  },

  // Dates shown on the legal pages so a reader can tell how current they are.
  lastUpdated: '2026-09-12',
};

// True when a field is still a placeholder, so the pages can say so plainly
// instead of printing the word TODO at a customer.
export function isPlaceholder(value) {
  return typeof value === 'string' && value.startsWith('TODO_');
}

// What to render for a field that has not been filled in yet.
export function detail(value, fallback = 'יעודכן בקרוב') {
  return isPlaceholder(value) || !value ? fallback : value;
}

// Fields that only exist once the business is registered. Asking the owner to
// fill these in while `registered` is false would be asking for a number that
// does not exist, so the handover list leaves them out until it does.
const REGISTRATION_FIELDS = ['registrationType', 'registrationNumber'];

// Everything the owner still has to supply, for the handover list.
export function missingBusinessDetails() {
  const missing = [];
  const walk = (obj, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      if (!BUSINESS.registered && path === '' && REGISTRATION_FIELDS.includes(key)) continue;
      if (typeof value === 'string' && isPlaceholder(value)) missing.push(`${path}${key}`);
      else if (value && typeof value === 'object') walk(value, `${path}${key}.`);
    }
  };
  walk(BUSINESS);
  return missing;
}
