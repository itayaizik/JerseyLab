// Real size tables (height cm / weight kg per size).
// Two shirt versions: fan (גרסת אוהד) and player (גרסת שחקן, slimmer fit).
// Length/width garment dimensions can be appended per size later for per-product matching.
//
// Recommendation philosophy: this is a sizing ADVISOR, not a height/weight calculator.
// Priority: (1) the size the user usually wears, (2) their fit preference,
// (3) height/weight/body as a consistency check — never overriding the user's stated size.

export const SIZE_TABLES = {
  fan: [
    { size: 'S',   hMin: 162, hMax: 170, wMin: 50, wMax: 62 },
    { size: 'M',   hMin: 170, hMax: 176, wMin: 62, wMax: 70 },
    { size: 'L',   hMin: 175, hMax: 182, wMin: 70, wMax: 83 },
    { size: 'XL',  hMin: 182, hMax: 190, wMin: 83, wMax: 90 },
    { size: '2XL', hMin: 192, hMax: 197, wMin: 90, wMax: 97 },
    { size: '3XL', hMin: 197, hMax: 200, wMin: 97, wMax: 104 },
  ],
  player: [
    { size: 'S',   hMin: 162, hMax: 170, wMin: 50, wMax: 62 },
    { size: 'M',   hMin: 170, hMax: 176, wMin: 62, wMax: 75 },
    { size: 'L',   hMin: 175, hMax: 180, wMin: 75, wMax: 80 },
    { size: 'XL',  hMin: 180, hMax: 185, wMin: 80, wMax: 85 },
    { size: '2XL', hMin: 185, hMax: 190, wMin: 85, wMax: 90 },
    { size: '3XL', hMin: 190, hMax: 195, wMin: 90, wMax: 95 },
  ],
};

function nearest(val, sizes, key) {
  const lo = key === 'h' ? 'hMin' : 'wMin';
  const hi = key === 'h' ? 'hMax' : 'wMax';
  const exact = sizes.find((s) => val >= s[lo] && val <= s[hi]);
  if (exact) return { size: exact.size, inRange: true };
  let best = sizes[0];
  let bestDist = Infinity;
  for (const s of sizes) {
    const dist = val < s[lo] ? s[lo] - val : val - s[hi];
    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }
  return { size: best.size, inRange: false };
}

// Returns { recommended, note, fitUsed, table } or null when usualSize is missing.
// The user's usual size is the anchor; fit preference may shift it up;
// height/weight (if provided) are a consistency check surfaced as a note, never an override.
export function recommendSize({ usualSize, fitPreference = 'regular', height, weight, table = 'fan' }) {
  if (!usualSize) return null;
  const sizes = SIZE_TABLES[table] || SIZE_TABLES.fan;
  const order = sizes.map((s) => s.size);
  const idx = (s) => order.indexOf(s);
  const start = idx(usualSize);
  if (start === -1) return null;

  // Step 1 — anchor on the usual size; a looser fit preference bumps up one size.
  // (Tight fits don't downsize: football shirts already run slim.)
  let recommended = usualSize;
  if ((fitPreference === 'loose' || fitPreference === 'semi_loose') && start + 1 < order.length) {
    recommended = order[start + 1];
  }

  // Step 2 — body check (weight primary) against the table, purely informational.
  const h = Number(height);
  const w = Number(weight);
  let bodySize = null;
  if (h && w) {
    bodySize = nearest(w, sizes, 'w').size;
  }

  const fitUsed = !!fitPreference && fitPreference !== 'regular';

  let note = null;
  if (bodySize && bodySize !== recommended) {
    note = `לפי הגובה והמשקל שלך בלבד היית עשוי להתאים גם ל־${bodySize}, אבל בחרנו ב־${recommended} בהתאם להעדפת הגזרה ולמידה שאתה רגיל ללבוש.`;
  } else if (bodySize) {
    note = `ההמלצה תואמת גם למידות הגוף שלך (גובה ומשקל).`;
  } else {
    note = `ההמלצה מבוססת על המידה שאתה רגיל ללבוש${fitUsed ? ' והעדפת הגזרה' : ''}.`;
  }

  return { recommended, note, fitUsed, table };
}