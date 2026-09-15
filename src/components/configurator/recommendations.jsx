import { t } from '@/lib/i18n';
import { EXTRA_PRICES } from '@/lib/cart';

// Personalization tips - based on actual shirt data, never invented

export function getShirtTypeTip() {
  return t('גרסת שחקן מגיעה עם בד דק ונושם וגזרה צמודה יותר - כמו שהשחקנים לובשים במגרש.',
    'The player version comes in light, breathable fabric with a slimmer fit - as the players wear it on the pitch.');
}

export function getPersonalizationTip(shirt) {
  if (shirt.is_retro) return t('חולצת רטרו - הדפסת שם ומספר תוסיף לה את המראה של התקופה.', 'A retro shirt - a printed name and number gives it the look of its era.');
  if (shirt.is_rare) return t('פריט נדיר - בלי הדפסה הוא נשמר נקי וקלאסי.', 'A rare piece - without a print it stays clean and classic.');
  return t('בלי שם ומספר זו חולצה קלאסית ונקייה - אבל אפשר גם להתאים אישית.', 'Without a name and number it is a clean, classic shirt - but you can personalise it too.');
}

export function calcTotal(basePrice, shirtType, addName) {
  return basePrice + (shirtType === 'player' ? EXTRA_PRICES.player : 0) + (addName === 'yes' ? EXTRA_PRICES.name : 0);
}
