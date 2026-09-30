// The clubs this shopper has already bought from.
//
// "מומלצות" used to mean whatever order the list happened to arrive in, which
// on a collection page was newest season first. It is worth more than that:
// someone who has bought a Hapoel shirt is more likely to want another one
// than to want whatever went up last night.
//
// What is kept is a short list of club names and nothing else - no ids, no
// order details - on this device only. It never leaves the browser, and a
// shopper who clears their site data simply goes back to the general order.


const KEY = 'jl_taste_clubs';
const MAX = 8;

const read = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter(x => typeof x === 'string') : [];
  } catch {
    // Private windows and blocked site data both throw here, and neither is
    // a reason to fail to draw a catalogue.
    return [];
  }
};

export const preferredClubs = () => read();

// Most recent first, so a shopper whose taste moves is followed rather than
// anchored to their first order.
export function rememberClubs(clubs) {
  const fresh = [...new Set((clubs || []).filter(Boolean))];
  if (!fresh.length) return read();
  const merged = [...fresh, ...read().filter(c => !fresh.includes(c))].slice(0, MAX);
  try { localStorage.setItem(KEY, JSON.stringify(merged)); } catch { /* nothing to do */ }
  return merged;
}
