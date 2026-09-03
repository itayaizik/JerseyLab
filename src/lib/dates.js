// Rows imported from Base44 - and every row written before the adapter started
// stamping it - can have a null `created_date`. `new Date(null)` is the epoch,
// so those were all rendering as 01/01/1970 instead of admitting they have no
// date. These helpers make a missing date look missing.

export function parseDate(value) {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value, fallback = '-') {
  const d = parseDate(value);
  return d ? d.toLocaleDateString('he-IL') : fallback;
}

export function formatDateTime(value, fallback = '-') {
  const d = parseDate(value);
  if (!d) return fallback;
  return d.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Sort key. Undated rows sort last in a newest-first list rather than being
// treated as 1970 and buried under everything.
export function dateSortValue(value) {
  const d = parseDate(value);
  return d ? d.getTime() : -Infinity;
}
