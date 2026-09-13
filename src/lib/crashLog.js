import { base44 } from '@/api/base44Client';

// A record of what broke, so a crash can be fixed rather than guessed at.
//
// "The site crashed" is all the owner can report, and without the error there
// is nothing to go on. Every crash is kept in this browser (the last 20), and
// on admin pages, where the owner is signed in, it is also written to the admin
// log as "שגיאה באתר" with the page, the message and the stack.

const KEY = 'jl_crash_log';

// Noise browsers raise that is not a failure of the site.
const IGNORED = /ResizeObserver loop|Script error\.?$|Non-Error promise rejection captured/i;

let lastSignature = '';
let lastAt = 0;

export function readCrashLog() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function recordCrash(error, { source = 'render', componentStack = '' } = {}) {
  const message = String(error?.message || error || 'unknown error');
  if (IGNORED.test(message)) return null;

  // One error often fires several times in a row; it is recorded once.
  const signature = `${source}:${message}`;
  const now = Date.now();
  if (signature === lastSignature && now - lastAt < 5000) return null;
  lastSignature = signature;
  lastAt = now;

  const entry = {
    at: new Date().toISOString(),
    path: window.location.pathname + window.location.search,
    source,
    message: message.slice(0, 500),
    stack: String(error?.stack || componentStack || '').slice(0, 1500),
    agent: navigator.userAgent.slice(0, 160),
  };

  try {
    localStorage.setItem(KEY, JSON.stringify([entry, ...readCrashLog()].slice(0, 20)));
  } catch { /* private mode - the admin log below still has it */ }

  if (window.location.pathname.startsWith('/admin')) {
    base44.auth.me()
      .then(user => base44.entities.AdminLog.create({
        action: 'שגיאה באתר',
        entity_type: 'Crash',
        entity_id: '',
        details: `${entry.path} | ${entry.source} | ${entry.message} | ${entry.stack.slice(0, 800)}`,
        admin_user_id: user?.id,
      }))
      .catch(() => {});
  }

  return entry;
}
