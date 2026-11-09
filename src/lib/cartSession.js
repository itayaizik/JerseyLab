import { supabase } from '@/lib/supabase';
import { cartItemTotal } from '@/lib/cart';

// Where the shop loses people between adding a shirt and sending the order.
//
// The cart lives in sessionStorage and never reached the server, so a basket
// that was filled and abandoned left no trace at all: the only thing anyone
// could count was the orders that arrived. Half the question - how many people
// got close and did not finish, and what was in their basket - had no answer.
//
// It holds no personal data. Not the name, not the phone, not the email. The
// id is a random string this browser made for itself, so a row says "a basket
// worth ₪160 with two shirts reached the details step and stopped" and nothing
// whatever about who. That is the number worth having, and it costs nobody
// their details.
//
// Every write is best-effort. None of this is worth a visitor seeing an error,
// or slowing a page down, so failures are swallowed and the shop simply has
// one fewer row.

const KEY = 'jerseylab_cart_session';

// The last form field touched, so a keystroke does not become a write.
let lastField = null;


// How long before a browser is treated as a new visit rather than the same one
// coming back. A basket abandoned yesterday and a basket abandoned an hour ago
// are different events and should not be written over each other.
const SESSION_HOURS = 12;

function newId() {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch { /* older browser */ }
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

// The id for the basket being filled right now, made on first use and kept
// until it is ordered or goes stale.
function sessionId() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const age = Date.now() - (saved.at || 0);
      if (saved.id && age < SESSION_HOURS * 60 * 60 * 1000) return saved.id;
    }
  } catch { /* private mode, or something else wrote the key */ }

  const id = newId();
  try { localStorage.setItem(KEY, JSON.stringify({ id, at: Date.now() })); } catch { /* private mode */ }
  return id;
}

// Starts the next basket from scratch, so a second order in the same visit is
// its own row rather than an edit of the one already sent.
export function endCartSession() {
  lastField = null;
  try { localStorage.removeItem(KEY); } catch { /* private mode */ }
}

// What is in the basket, in the plainest terms that still answer "what do
// people abandon?" - the shirt and the size, which the shop already shows
// everyone. No prices per line, because the total is on the row already.
const summarise = (cart) => (cart || [])
  .map(item => [item.shirtName, item.size].filter(Boolean).join(' · '))
  .slice(0, 12);

// One function call, because this table cannot be read from the site.
//
// Writing the row from the browser does not work and does not say so: an
// upsert makes Postgres read the conflicting row, and an update's WHERE reads
// the id column, and reading this table is admin-only on purpose. The upsert
// came back as a policy violation; the update came back 204 having changed
// nothing at all, which is the worse of the two - a basket that reached the
// checkout recorded forever as one that never did.
//
// `record_cart_session` writes the row and returns nothing, so a visitor can
// record their own basket and still cannot see anyone's, which is the whole
// point of keeping the table unreadable. A null argument means "this call is
// not about that column", so reporting the checkout does not erase the basket.
async function write(row) {
  try {
    await supabase.rpc('record_cart_session', {
      p_id: sessionId(),
      p_items: row.items ?? null,
      p_item_count: row.item_count ?? null,
      p_value: row.value ?? null,
      p_reached_checkout: row.reached_checkout ?? null,
      p_ordered: row.ordered ?? null,
      p_order_id: row.order_id ?? null,
      p_stopped_at: row.stopped_at ?? null,
    });
  } catch { /* counting is never worth an error in front of a customer */ }
}

// Called whenever the basket changes. An empty basket is not recorded: the
// row should mean "someone put something in and did not finish", and a visitor
// who emptied their basket on purpose did finish, in their own way.
export function recordCart(cart) {
  if (!cart || cart.length === 0) return;
  write({
    items: JSON.stringify(summarise(cart)),
    item_count: cart.length,
    value: cart.reduce((sum, item) => sum + cartItemTotal(item), 0),
  });
}

// They opened the details step. From here on, an unfinished basket is an
// abandoned checkout rather than an abandoned basket - a different problem
// with a different fix, so it is worth telling the two apart.
export function recordReachedCheckout() {
  write({ reached_checkout: true });
}

// The name of the last field touched before leaving, so the shop can see where
// the form loses people. The name only - never a word of what was typed in it.
//
// Only when the field changes. This is called on every keystroke, and a write
// per letter would be a few hundred rows of traffic for one form and tell
// nobody anything the field name does not already say.
export function recordStoppedAt(field) {
  if (!field || field === lastField) return;
  lastField = field;
  write({ stopped_at: field });
}

// It went through. The row stays, because "how many baskets became orders" is
// the question the rest of the table exists to answer.
export function recordOrdered(orderId) {
  write({ ordered: true, order_id: orderId || '' });
  endCartSession();
}
