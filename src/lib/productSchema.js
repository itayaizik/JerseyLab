// The structured data a shirt page tells Google, written once.
//
// It existed twice: the build wrote a rich version into the served HTML, and
// the app wrote a thinner one over the top of it once React mounted - a
// different offer URL, no shipping, no returns, no seller. Googlebot renders
// JavaScript, so a shirt page ended up declaring two different Products and
// Google had to pick. Both sides now build from here.
//
// The shipping numbers come from lib/business, which is where the shipping
// policy page gets them, so the price in the search result and the price on
// the policy cannot drift apart. They already had: the delivery fee became ₪20
// and the structured data went on telling Google ₪25.

// Relative, not the @ alias: the build scripts import this file in plain node,
// where the alias does not exist.
import { BUSINESS } from './business.js';
import { SITE_ORIGIN } from './siteUrl.js';

export const SHOP_ID = `${SITE_ORIGIN}/#shop`;

// '20 ₪' -> 20. The policy fields are written the way they should read on the
// page, units included, and a number is what goes in structured data.
const amount = (value) => {
  const digits = String(value ?? '').replace(/[^\d.]/g, '');
  return digits ? Number(digits) : null;
};

const DELIVERY_PRICE = amount(BUSINESS.shipping.price);

// Google wants to know what an order costs to ship and how long it takes
// before it will show a price and availability in the results.
//
// The one delivery option, at its full price. The shop also delivers free
// above a threshold and hands orders over in Kiryat Ono for nothing, but a
// structured-data shipping rate is read as the rate, not as the best case -
// quoting either of those here would be promising every shopper a price most
// of them will not get.
export const SHIPPING_DETAILS = {
  '@type': 'OfferShippingDetails',
  shippingRate: { '@type': 'MonetaryAmount', value: DELIVERY_PRICE ?? 0, currency: 'ILS' },
  shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IL' },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
    transitTime: { '@type': 'QuantitativeValue', minValue: 5, maxValue: 21, unitCode: 'DAY' },
  },
};

// The 14 days are the ones the Consumer Protection Law gives on a distance
// sale, not a policy choice, so they do not belong in lib/business with the
// numbers the shop picks.
export const RETURN_POLICY = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'IL',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 14,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/ReturnShippingFees',
  returnShippingFeesAmount: { '@type': 'MonetaryAmount', value: DELIVERY_PRICE ?? 0, currency: 'ILS' },
  merchantReturnLink: `${SITE_ORIGIN}/legal/shipping`,
};

// The shop itself. There is no counter to walk into, so this is an OnlineStore
// rather than a LocalBusiness - but it serves Israel and hands orders over in
// Kiryat Ono, and both of those are worth saying where a search engine reads.
export const ORGANISATION = {
  '@type': 'OnlineStore',
  '@id': SHOP_ID,
  name: BUSINESS.tradingName,
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/icon-512.png`,
  image: `${SITE_ORIGIN}/og-image.jpg?v=2`,
  description: 'חנות חולצות כדורגל לאספנים ולאוהדים: חולצות מועדונים ונבחרות, חדשות ורטרו, עם הדפסת שם ומספר. משלוח לכל הארץ או איסוף מקריית אונו.',
  currenciesAccepted: 'ILS',
  areaServed: { '@type': 'Country', name: 'Israel' },
  address: {
    '@type': 'PostalAddress',
    addressLocality: BUSINESS.address,
    addressCountry: 'IL',
  },
  sameAs: [`https://instagram.com/${String(BUSINESS.instagram || '').replace(/^@/, '')}`],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    // With the plus. The stored form has none, because it is what a wa.me
    // link wants, and a phone number in structured data is read as E.164.
    telephone: `+${String(BUSINESS.phoneE164).replace(/^\+/, '')}`,
    email: BUSINESS.email,
    availableLanguage: ['he', 'en'],
    url: `${SITE_ORIGIN}/contact`,
  },
};

// A year out: the tag only has to say the price is not stale, and the build
// runs often enough to keep pushing it forward.
export const priceValidUntil = () =>
  new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

// Stars in a search result, where there is something real to average. With no
// reviews there is no average worth printing, and inventing one would be the
// kind of thing this shop does not do.
//
// Takes either the reviews themselves, which is what the build has, or the
// count and average the page has already worked out.
export function aggregateRating(reviews) {
  if (!reviews) return null;

  let count;
  let average;
  if (Array.isArray(reviews)) {
    const rated = reviews.filter(r => Number(r.rating) > 0);
    if (rated.length === 0) return null;
    count = rated.length;
    average = rated.reduce((total, r) => total + Number(r.rating), 0) / rated.length;
  } else {
    count = Number(reviews.count) || 0;
    average = Number(reviews.average) || 0;
    if (count === 0 || average === 0) return null;
  }

  return {
    '@type': 'AggregateRating',
    ratingValue: Math.round(average * 10) / 10,
    reviewCount: count,
    bestRating: 5,
    worstRating: 1,
  };
}

// The Product node for one shirt, the same on both sides.
//
// `url` is the slug address and nothing else. The offer used to point at
// /shirt/<id>, the old address, which is the one page on the site whose
// canonical says it is somewhere else - so the offer was attached to a URL
// the shop itself says is not the product.
export function productSchema({ name, description, url, image, shirt, price, reviews }) {
  const rating = aggregateRating(reviews);
  return {
    '@type': 'Product',
    name,
    description,
    url,
    ...(image ? { image: [image] } : {}),
    sku: shirt.id,
    brand: { '@type': 'Brand', name: BUSINESS.tradingName },
    ...(rating ? { aggregateRating: rating } : {}),
    offers: {
      '@type': 'Offer',
      url,
      price,
      priceCurrency: 'ILS',
      priceValidUntil: priceValidUntil(),
      availability: shirt.status === 'available'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: shirt.condition && shirt.condition !== 'new'
        ? 'https://schema.org/UsedCondition'
        : 'https://schema.org/NewCondition',
      seller: { '@id': SHOP_ID },
      shippingDetails: SHIPPING_DETAILS,
      hasMerchantReturnPolicy: RETURN_POLICY,
    },
  };
}
