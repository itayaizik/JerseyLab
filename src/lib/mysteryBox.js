// Mystery box pricing, in one place. The home page shows the price list and
// the configurator charges it; if these were two lists the site would sooner
// or later advertise one price and bill another.
//
// `label` is Hebrew on purpose: it is what goes into the order the owner reads.
// The English site shows `labelEn` and `blurbEn`.

export const BOX_TYPES = [
  {
    id: 'regular',
    label: 'רגיל',
    labelEn: 'Regular',
    price: 70,
    blurb: 'חולצת מועדון מהעונות האחרונות - ליגות אירופה או ישראל.',
    blurbEn: 'A club shirt from recent seasons - European or Israeli leagues.',
  },
  {
    id: 'retro',
    label: 'רטרו',
    labelEn: 'Retro',
    price: 80,
    blurb: 'חולצה קלאסית מהארכיון. עונות ישנות ודגמים שכבר לא מייצרים.',
    blurbEn: 'A classic from the archive. Old seasons and designs no longer made.',
  },
  {
    id: 'mundial',
    label: 'מונדיאל',
    labelEn: 'World Cup',
    price: 70,
    blurb: 'חולצת נבחרת - מונדיאל או יורו, בית או חוץ.',
    blurbEn: 'A national team shirt - World Cup or Euro, home or away.',
  },
];

// Both add-ons are opt-in. Name-and-number is priced but deliberately not
// specifiable: the shirt is unknown when the order is placed, so we pick the
// player that fits whatever comes out. Letting the customer type a name would
// promise a pairing the product cannot guarantee.
export const NAME_PRICE = 10;
export const PATCHES_PRICE = 5;

export const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

// A mystery box has no catalogue row behind it, so it carries a sentinel id.
// The admin panel and the profile page both fall back to the stored name when
// no shirt matches, which is what makes this work without a fake DB entry.
export const MYSTERY_BOX_ID = 'mystery-box';
