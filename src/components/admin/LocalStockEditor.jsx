import React from 'react';
import { Plus, Trash2, Copy } from 'lucide-react';
import { newStockItem, stockSummaryText } from '@/lib/localStock';

// Local stock, one row per physical shirt in Israel.
//
// Shared by the inline editor in the shirt list and the add and edit pages,
// which used to carry three copies of a count-per-size form. A row is a shirt:
// its size, what is printed on the back and whether it is the player version.
// Two size S shirts with different names are two rows, and each one is offered
// to the customer as its own "buy exactly this one".
//
// When one sells, delete its row. Duplicate copies the size and version and
// leaves the print empty, since the next shirt in a batch usually differs only
// in the name.

const FIELD = 'bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-chalk focus:border-turf focus:outline-none';

export default function LocalStockEditor({ items, onChange, sizes }) {
  const update = (id, patch) => onChange(items.map(item => (item.id === id ? { ...item, ...patch } : item)));
  const remove = (id) => onChange(items.filter(item => item.id !== id));
  const duplicate = (item) => {
    const at = items.findIndex(x => x.id === item.id);
    const copy = { ...newStockItem(item.size), player_version: item.player_version };
    onChange([...items.slice(0, at + 1), copy, ...items.slice(at + 1)]);
  };
  const add = () => onChange([...items, newStockItem(items[items.length - 1]?.size || 'M')]);

  return (
    <div className="border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading font-bold text-sm text-turf">מלאי בארץ</h3>
        <span className="text-xs text-varnish">
          {items.length ? `${items.length} חולצות בארץ · ${stockSummaryText(items)}` : 'אין מלאי בארץ'}
        </span>
      </div>
      <p className="text-xs text-varnish">
        כל שורה היא חולצה אחת שנמצאת פיזית בארץ. שתי חולצות באותה מידה עם שם שונה על הגב הן שתי שורות,
        והלקוח יראה כל אחת כאפשרות "קנה בדיוק את זו". כשחולצה נמכרת, מוחקים את השורה שלה.
      </p>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, i) => {
            const options = sizes.includes(item.size) ? sizes : [item.size, ...sizes];
            return (
              <div key={item.id} className="flex flex-wrap items-center gap-2 border border-white/10 bg-pitch/40 p-2">
                <span className="text-xs text-varnish font-mono w-5 text-center">{i + 1}</span>
                <select value={item.size} onChange={e => update(item.id, { size: e.target.value })} aria-label="מידה" className={FIELD}>
                  {options.map(size => <option key={size} value={size}>{size}</option>)}
                </select>
                <input value={item.name} onChange={e => update(item.id, { name: e.target.value })}
                  placeholder="שם על הגב (לא חובה)" aria-label="שם על הגב" dir="ltr"
                  className={`${FIELD} flex-1 min-w-[130px]`} />
                <input value={item.number} onChange={e => update(item.id, { number: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                  placeholder="מס׳" aria-label="מספר על הגב" inputMode="numeric" dir="ltr"
                  className={`${FIELD} w-16`} />
                <label className="flex items-center gap-1.5 text-xs text-chalk cursor-pointer">
                  <input type="checkbox" checked={item.player_version} onChange={e => update(item.id, { player_version: e.target.checked })} className="accent-turf" />
                  גרסת שחקן
                </label>
                <button type="button" onClick={() => duplicate(item)} title="עוד חולצה באותה מידה" aria-label={`שכפל שורה ${i + 1}`}
                  className="p-1.5 text-varnish hover:text-turf transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => remove(item.id)} title="הסר (נמכרה)" aria-label={`הסר שורה ${i + 1}`}
                  className="p-1.5 text-varnish hover:text-redcard transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-sm text-turf border border-dashed border-turf/40 px-3 py-2 hover:bg-turf/10 transition-colors">
        <Plus className="w-4 h-4" /> הוסף חולצה שנמצאת בארץ
      </button>
    </div>
  );
}
