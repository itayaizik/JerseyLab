// The shop's own contact details, in one place. The contact page reads a
// `whatsapp_link` SiteSetting instead; these constants are what the cart uses so
// checkout never renders a dead link when that setting is missing or unset.

export const SHOP_PHONE = '050-558-6255';
export const SHOP_PHONE_E164 = '972505586255';
export const WHATSAPP_URL = `https://wa.me/${SHOP_PHONE_E164}`;

export const INSTAGRAM_HANDLE = 'Jerseylabil';
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;

export const CONTACT_CHANNELS = {
  whatsapp: { id: 'whatsapp', label: 'WhatsApp' },
  instagram: { id: 'instagram', label: 'Instagram' },
};
