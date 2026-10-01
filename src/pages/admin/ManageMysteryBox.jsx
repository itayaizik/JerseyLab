import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Gift, ChevronUp, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { BOX_TYPES } from '@/lib/mysteryBox';
import { normalizeTiers, discountFor } from '@/lib/mysteryTiers';

// The quantity ladder for the mystery box (supabase/mystery_pricing.sql).
//
// A tier is shekels off each box in an order that reaches its size - not a
// price of its own. One ladder then governs all three styles at once, and a
// retro box stays ₪10 dearer than a regular one at every quantity, which is
// the only relationship that has to hold.
//
// The table below prices a real order at each rung, because a discount in the
// abstract is hard to judge and "a retro box at ₪65" is not.

export default function ManageMysteryBox() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState({ min_boxes: '', discount: '' });
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setTiers(await base44.entities.MysteryTier.list('min_boxes', 40));
      setError('');
    } catch {
      setError('לא הצלחנו לטעון. אם זו הפעם הראשונה, צריך קודם להריץ את supabase/mystery_pricing.sql.');
    }
    setLoading(false);
  }

  const patch = async (tier, changes) => {
    setTiers(p => p.map(x => (x.id === tier.id ? { ...x, ...changes } : x)));
    try {
      await base44.entities.MysteryTier.update(tier.id, changes);
    } catch {
      alert('לא נשמר. ייתכן שכבר קיימת מדרגה שמתחילה באותה כמות.');
      await load();
    }
  };

  const add = async () => {
    const min = parseInt(adding.min_boxes, 10);
    const off = parseInt(adding.discount, 10);
    if (!Number.isFinite(min) || min < 1) return;
    try {
      await base44.entities.MysteryTier.create({
        min_boxes: min,
        discount: Number.isFinite(off) ? Math.max(0, off) : 0,
        active: true,
      });
      setAdding({ min_boxes: '', discount: '' });
      await load();
    } catch {
      alert('לא נוסף. כנראה כבר יש מדרגה שמתחילה בכמות הזו.');
    }
  };

  // One switch for the whole ladder, so it can be taken down for a week and put
  // back without retyping the numbers. Turning it off deactivates every tier,
  // which is what the shop reads: with nothing active the table disappears from
  // the mystery box page and the quantity step goes back to a plain counter.
  const setLadderActive = async (on) => {
    if (!on && !window.confirm('לכבות את הנחת הכמות? הטבלה תיעלם מהאתר והמחירים יחזרו למחיר המלא. המדרגות נשמרות ואפשר להחזיר אותן בלחיצה.')) return;
    setLoading(true);
    try {
      await Promise.all(tiers.map(tier => base44.entities.MysteryTier.update(tier.id, { active: on })));
    } catch {
      alert('לא הצלחנו לעדכן את כל המדרגות. רענן ונסה שוב.');
    }
    await load();
  };

  const remove = async (tier) => {
    if (!window.confirm(`למחוק את המדרגה שמתחילה ב-${tier.min_boxes} בוקסים?`)) return;
    await base44.entities.MysteryTier.delete(tier.id);
    setTiers(p => p.filter(x => x.id !== tier.id));
  };

  // `live` is what the shop actually sees: normalizeTiers reads the rows as the
  // site does, and an inactive row is not in them.
  const ladder = normalizeTiers(tiers.filter(t => t.active));
  const live = ladder.some(tier => tier.discount > 0);
  const anyActive = tiers.some(t => t.active);
  const hasTiers = tiers.length > 0;
  // Quantities worth seeing priced: every rung, and one box either way of it.
  const samples = [...new Set([1, ...ladder.flatMap(tier => [tier.minBoxes])])].sort((a, b) => a - b);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-black text-2xl text-turf mb-1">מיסטרי בוקס</h1>
        <p className="text-sm text-varnish font-body">
          הנחת כמות: כמה יורד מכל בוקס, לפי כמה בוקסים יש בהזמנה.
        </p>
      </div>

      <div className={`rounded-2xl border-2 p-4 mb-6 ${live ? 'border-turf/50 bg-turf/10' : 'border-brand-orange/50 bg-brand-orange/10'}`}>
        <p className="text-sm text-chalk font-body leading-relaxed">
          {live ? (
            <>
              <strong>ההנחה פעילה.</strong> הלקוח רואה את הטבלה בדף המיסטרי בוקס, כמה הוא חוסך,
              וכמה בוקסים חסרים לו למדרגה הבאה.
            </>
          ) : (
            <>
              <strong>אין כרגע הנחת כמות.</strong> כל בוקס עולה את המחיר של הסגנון שלו, והטבלה
              לא מוצגת ללקוח בכלל. ברגע שתוסיף מדרגה עם הנחה גדולה מאפס — היא תופיע.
            </>
          )}
        </p>
      </div>

      {error && <p role="alert" className="rounded-lg mb-6 border border-redcard/40 bg-redcard/10 p-3 text-sm text-redcard">{error}</p>}

      {/* Off and on again without losing the numbers. */}
      {hasTiers && (
        <div className="rounded-2xl border border-brand-line bg-white p-4 mb-6 shadow-card flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-chalk">הנחת הכמות באתר</p>
            <p className="text-xs text-varnish mt-0.5">
              {anyActive
                ? 'פעילה. כיבוי משאיר את המדרגות שמורות כאן ומסיר אותן מהאתר.'
                : 'כבויה. הלקוחות רואים מחיר מלא, והמדרגות ממתינות כאן.'}
            </p>
          </div>
          <button onClick={() => setLadderActive(!anyActive)} disabled={loading}
            className={`rounded-2xl px-4 py-2.5 text-sm font-bold disabled:opacity-40 ${
              anyActive ? 'border border-brand-line text-chalk hover:border-redcard hover:text-redcard' : 'bg-turf text-pitch'}`}>
            {anyActive ? 'כיבוי ההנחה' : 'הפעלת ההנחה'}
          </button>
        </div>
      )}

      {/* Add */}
      <div className="rounded-2xl border border-brand-line bg-white p-4 mb-6 shadow-card">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex-1 min-w-[140px]">
            <span className="block text-xs text-varnish mb-1">החל מכמה בוקסים</span>
            <input type="number" min="1" value={adding.min_boxes} inputMode="numeric"
              onChange={e => setAdding(a => ({ ...a, min_boxes: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') add(); }}
              placeholder="3"
              className="rounded-xl w-full bg-brand-mist border border-brand-line px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
          </label>
          <label className="flex-1 min-w-[140px]">
            <span className="block text-xs text-varnish mb-1">כמה ₪ יורד מכל בוקס</span>
            <input type="number" min="0" value={adding.discount} inputMode="numeric"
              onChange={e => setAdding(a => ({ ...a, discount: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') add(); }}
              placeholder="5"
              className="rounded-xl w-full bg-brand-mist border border-brand-line px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
          </label>
          <button onClick={add} disabled={!adding.min_boxes}
            className="rounded-2xl flex items-center gap-1 bg-turf text-pitch px-4 py-2.5 text-sm font-bold disabled:opacity-40">
            <Plus className="w-4 h-4" /> הוסף מדרגה
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {tiers.map((tier, i) => (
              <div key={tier.id} className={`rounded-2xl flex flex-wrap items-center gap-2 border border-brand-line p-3 ${tier.active ? 'bg-white' : 'bg-brand-mist opacity-70'}`}>
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-mist text-brand-navy/60">
                  {i === 0 ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </span>
                <label className="flex items-center gap-2">
                  <span className="text-xs text-varnish">מ-</span>
                  <input type="number" min="1" defaultValue={tier.min_boxes} inputMode="numeric"
                    onBlur={e => { const v = parseInt(e.target.value, 10); if (v >= 1 && v !== tier.min_boxes) patch(tier, { min_boxes: v }); }}
                    className="rounded-xl w-20 bg-brand-mist border border-brand-line px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" />
                  <span className="text-xs text-varnish">בוקסים</span>
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-xs text-varnish">הנחה</span>
                  <input type="number" min="0" defaultValue={tier.discount} inputMode="numeric"
                    onBlur={e => { const v = parseInt(e.target.value, 10); if (v >= 0 && v !== tier.discount) patch(tier, { discount: v }); }}
                    className="rounded-xl w-20 bg-brand-mist border border-brand-line px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" />
                  <span className="text-xs text-varnish">₪ לכל בוקס</span>
                </label>
                <span className="mr-auto flex items-center gap-2">
                  <button onClick={() => patch(tier, { active: !tier.active })}
                    className="rounded-lg px-2.5 py-1.5 text-xs border border-brand-line text-brand-navy/70 hover:border-turf hover:text-turf transition-colors">
                    {tier.active ? 'פעילה' : 'מושבתת'}
                  </button>
                  <button onClick={() => remove(tier)} aria-label="מחק"
                    className="rounded-lg px-2 py-1.5 text-brand-navy/30 hover:text-redcard transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </span>
              </div>
            ))}
          </div>

          {/* What it actually costs, which is the only way to judge a ladder. */}
          <div className="rounded-2xl border border-brand-line bg-white p-4 mt-6 shadow-card overflow-x-auto">
            <p className="text-sm font-bold text-chalk mb-3 flex items-center gap-2">
              <Gift className="w-4 h-4 text-turf" /> כמה זה יוצא בפועל
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-varnish text-xs">
                  <th className="text-right py-2 px-2">כמות</th>
                  {BOX_TYPES.map(type => <th key={type.id} className="text-right py-2 px-2">{type.label}</th>)}
                  <th className="text-right py-2 px-2">הנחה לבוקס</th>
                </tr>
              </thead>
              <tbody>
                {samples.map(n => {
                  const off = discountFor(ladder, n);
                  return (
                    <tr key={n} className="border-t border-brand-line">
                      <td className="py-2 px-2 font-bold text-chalk">{n} בוקסים</td>
                      {BOX_TYPES.map(type => (
                        <td key={type.id} className="py-2 px-2 font-mono text-chalk">
                          ₪{Math.max(0, type.price - off)}
                          {off > 0 && <span className="text-varnish line-through mr-1.5">₪{type.price}</span>}
                        </td>
                      ))}
                      <td className="py-2 px-2 font-mono text-turf">{off > 0 ? `-₪${off}` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[11px] text-varnish mt-3 leading-relaxed">
              המחירים כאן הם לפני תוספות (שם ומספר, פאצ'ים, שרוול ארוך, מכנס) — ההנחה לא חלה עליהן.
              מחירי הבסיס של הסגנונות נמצאים בקוד; אם תרצה לשנות גם אותם, תגיד לי.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
