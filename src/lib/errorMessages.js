// Friendly, human-readable Hebrew error messages for user-facing failures.
// Never exposes technical messages or status codes to the user.
export function friendlyError(err, fallback = 'משהו השתבש, נסה שוב בעוד רגע') {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'נראה שאין חיבור לאינטרנט. בדוק את החיבור ונסה שוב.';
  }
  const msg = (err?.message || '').toLowerCase();
  if (
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('timeout') ||
    msg.includes('econnaborted')
  ) {
    return 'בעיית תקשורת עם השרת. נסה שוב בעוד רגע.';
  }
  return fallback;
}