import { t } from './i18n.js';

// Friendly, human-readable error messages for user-facing failures, in the
// site's language. Never exposes technical messages or status codes to the user.
export function friendlyError(err, fallback = t('משהו השתבש, נסה שוב בעוד רגע', 'Something went wrong. Please try again in a moment.')) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return t('נראה שאין חיבור לאינטרנט. בדוק את החיבור ונסה שוב.', "It looks like you're offline. Check your connection and try again.");
  }
  const msg = (err?.message || '').toLowerCase();
  if (
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('timeout') ||
    msg.includes('econnaborted')
  ) {
    return t('בעיית תקשורת עם השרת. נסה שוב בעוד רגע.', 'A problem reaching the server. Please try again in a moment.');
  }
  return fallback;
}
