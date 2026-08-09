// Mystery box pricing, in one place. The home page shows the price list and
// the configurator charges it; if these were two lists the site would sooner
// or later advertise one price and bill another.

export const BOX_TYPES = [
  {
    id: 'regular',
    label: 'רגיל',
    price: 70,
    blurb: 'חולצת מועדון מהעונות האחרונות — ליגות אירופה או ישראל.',
  },
  {
    id: 'retro',
    label: 'רטרו',
    price: 90,
    blurb: 'חולצה קלאסית מהארכיון. עונות ישנות ודגמים שכבר לא מייצרים.',
  },
  {
    id: 'mundial',
    label: 'מונדיאל',
    price: 70,
    blurb: 'חולצת נבחרת — מונדיאל או יורו, בית או חוץ.',
  },
];

// Patches are the only paid add-on. Name-and-number is not offered on a
// mystery box: the shirt is unknown when the order is placed, so there is no
// player to print.
export const PATCHES_PRICE = 5;

export const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

// A mystery box has no catalogue row behind it, so it carries a sentinel id.
// The admin panel and the profile page both fall back to the stored name when
// no shirt matches, which is what makes this work without a fake DB entry.
export const MYSTERY_BOX_ID = 'mystery-box';
