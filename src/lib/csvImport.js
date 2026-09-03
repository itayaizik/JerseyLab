// Encoding-aware CSV reader for the bulk import.
// Handles UTF-8 (with and without BOM), falls back to Windows-1255 (Hebrew ANSI
// from Excel), and validates that the text decoded without replacement chars.

const HEBREW_RE = /[\u0590-\u05FF\uFB1D-\uFB4F]/;
const REPLACEMENT = '\uFFFD';

/**
 * Decode raw CSV bytes into a string, picking the right encoding.
 * Order: UTF-8 BOM (utf-8-sig) -> strict UTF-8 -> Windows-1255 fallback.
 * English/ASCII and any valid UTF-8 pass through the UTF-8 path untouched.
 */
export function decodeCsvBytes(input) {
  const arr = input instanceof ArrayBuffer ? new Uint8Array(input) : input;

  // utf-8-sig: strip the 3-byte BOM and decode as UTF-8
  const hasBom = arr.length >= 3 && arr[0] === 0xEF && arr[1] === 0xBB && arr[2] === 0xBF;
  if (hasBom) {
    const text = new TextDecoder('utf-8').decode(arr.subarray(3));
    return { text, encoding: 'utf-8-sig' };
  }

  // Try strict UTF-8 - throws on invalid byte sequences (e.g. Windows-1255 bytes)
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(arr);
    return { text, encoding: 'utf-8' };
  } catch (_) {
    // Excel Hebrew "ANSI" = Windows-1255
    const text = new TextDecoder('windows-1255').decode(arr);
    return { text, encoding: 'windows-1255' };
  }
}

/**
 * RFC-4180-ish CSV parser: handles quoted fields, escaped quotes (""),
 * commas and newlines inside quotes. Returns an array of string arrays.
 */
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field); field = '';
      } else if (ch === '\n') {
        row.push(field); field = ''; rows.push(row); row = [];
      } else if (ch === '\r') {
        // ignore - handled by \n
      } else {
        field += ch;
      }
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

/**
 * Convert decoded CSV text into header list + record objects keyed by
 * lowercased header names. Only rows with a `name` value are kept.
 */
export function rowsToObjects(text) {
  const rows = parseCSV(text);
  if (!rows.length) return { headers: [], records: [] };
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    if (cells.length === 0 || (cells.length === 1 && !cells[0].trim())) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (cells[idx] || '').trim(); });
    if (obj.name) records.push(obj);
  }
  return { headers, records };
}

/**
 * Pre-import validation: confirms the decoded text has no replacement chars
 * (which would indicate a mis-decoded file) and reports whether Hebrew was found.
 */
export function validateDecoded(text) {
  const issues = [];
  if (text.indexOf(REPLACEMENT) !== -1) {
    issues.push('זוהו תווים שבורים (\uFFFD) בקובץ - הקידוד אינו UTF-8 או Windows-1255. שמור את הקובץ מחדש כ-UTF-8 ב-Excel (Save As → CSV UTF-8).');
  }
  return {
    ok: issues.length === 0,
    issues,
    hasHebrew: HEBREW_RE.test(text),
  };
}