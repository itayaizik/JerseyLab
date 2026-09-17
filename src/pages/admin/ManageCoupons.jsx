import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Ticket, Copy, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { normalizeCode } from '@/lib/coupons';

// Coupon codes: creating them, and setting what each one gives and when it
// stops. The cart reads the same rows through check_coupon() in the database
// (supabase/coupons.sql), so a change here applies to the next customer who
// types the code.

const EMPTY = {
  code: '', description: '', active: true,
  discount_type: 'percent', discount_value: '', max_discount: '',
  applies_to: 'all', min_items: '', min_total: '',
  starts_at: '', ends_at: '', max_uses: '',
  once_per_customer: false, exclude_sale_items: false,
};

const APPLIES = { all: 'כל ההזמנה', shirts: 'רק חולצות מהקטלוג', mystery: 'רק מיסטרי בוקס' };

// datetime-local wants "2026-09-17T10:00" in local time; the table stores UTC.
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);
const numberOrNull = (value) => (value === '' || value === null || value === undefined ? null : Number(value));

const formatDate = (iso) => new Date(iso).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });

function summary(c) {
  const parts = [c.discount_type === 'percent' ? `${Number(c.discount_value)}% הנחה` : `₪${Number(c.discount_value)} הנחה`];
  if (c.discount_type === 'percent' && c.max_discount) parts.push(`עד ₪${Number(c.max_discount)}`);
  parts.push(APPLIES[c.applies_to] || APPLIES.all);
  if (c.min_items) parts.push(`מ-${c.min_items} פריטים`);
  if (Number(c.min_total)) parts.push(`מעל ₪${Number(c.min_total)}`);
  if (c.exclude_sale_items) parts.push('בלי כפל מבצעים');
  if (c.once_per_customer) parts.push('פעם אחת ללקוח');
  return parts.join(' · ');
}

function status(c) {
  const now = Date.now();
  if (!c.active) return { label: 'כבוי', tone: 'text-varnish' };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: `מתחיל ${formatDate(c.starts_at)}`, tone: 'text-yellow-400' };
  if (c.ends_at && new Date(c.ends_at).getTime() < now) return { label: 'פג תוקף', tone: 'text-redcard' };
  if (c.max_uses && c.uses >= c.max_uses) return { label: 'נוצל עד הסוף', tone: 'text-redcard' };
  return { label: 'פעיל', tone: 'text-turf' };
}

const input = 'w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none';

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-varnish">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-varnish/70">{hint}</span>}
    </label>
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 border border-white/10 bg-white/5 p-3">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-turf" />
      <span>
        <span className="block text-sm text-chalk">{label}</span>
        {hint && <span className="block text-[11px] text-varnish">{hint}</span>}
      </span>
    </label>
  );
}

function CouponForm({ initial, onSave, onCancel, saving, error }) {
  const [form, setForm] = useState(initial);
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const percent = form.discount_type === 'percent';

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="mb-6 space-y-4 border border-turf/30 bg-white/5 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="הקוד" hint="מה שהלקוח מקליד. אותיות באנגלית ומספרים, בלי רווחים.">
          <input value={form.code} onChange={e => set('code', normalizeCode(e.target.value))} dir="ltr" maxLength={40} required
            placeholder="FRIENDS10" className={`${input} uppercase`} />
        </Field>
        <Field label="תיאור לעצמך (לא מוצג ללקוח)">
          <input value={form.description} onChange={e => set('description', e.target.value)} maxLength={200}
            placeholder="למשל: הנחה לקבוצות חברים" className={input} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="סוג ההנחה">
          <select value={form.discount_type} onChange={e => set('discount_type', e.target.value)} className={input}>
            <option value="percent">אחוזים (%)</option>
            <option value="fixed">סכום קבוע (₪)</option>
          </select>
        </Field>
        <Field label={percent ? 'כמה אחוז' : 'כמה שקלים'}>
          <input type="number" min="1" max={percent ? 100 : undefined} step="1" required dir="ltr"
            value={form.discount_value} onChange={e => set('discount_value', e.target.value)} className={input} />
        </Field>
        {percent && (
          <Field label="הנחה מקסימלית ב-₪" hint="ריק = בלי הגבלה">
            <input type="number" min="1" step="1" dir="ltr"
              value={form.max_discount} onChange={e => set('max_discount', e.target.value)} className={input} />
          </Field>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="על מה ההנחה">
          <select value={form.applies_to} onChange={e => set('applies_to', e.target.value)} className={input}>
            {Object.entries(APPLIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <Field label="מינימום פריטים" hint="למשל 3 = רק מ-3 בוקסים/חולצות. ריק = בלי">
          <input type="number" min="0" step="1" dir="ltr"
            value={form.min_items} onChange={e => set('min_items', e.target.value)} className={input} />
        </Field>
        <Field label="מינימום סכום הזמנה ב-₪" hint="ריק = בלי">
          <input type="number" min="0" step="1" dir="ltr"
            value={form.min_total} onChange={e => set('min_total', e.target.value)} className={input} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="מתחיל ב-" hint="ריק = מיד">
          <input type="datetime-local" dir="ltr" value={form.starts_at} onChange={e => set('starts_at', e.target.value)} className={input} />
        </Field>
        <Field label="נגמר ב-" hint="ריק = בלי תאריך סיום">
          <input type="datetime-local" dir="ltr" value={form.ends_at} onChange={e => set('ends_at', e.target.value)} className={input} />
        </Field>
        <Field label="כמה פעמים אפשר להשתמש בסך הכל" hint="ריק = בלי הגבלה">
          <input type="number" min="1" step="1" dir="ltr"
            value={form.max_uses} onChange={e => set('max_uses', e.target.value)} className={input} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Toggle checked={form.exclude_sale_items} onChange={v => set('exclude_sale_items', v)}
          label="בלי כפל מבצעים" hint="לא חל על חולצות שכבר במחיר מבצע" />
        <Toggle checked={form.once_per_customer} onChange={v => set('once_per_customer', v)}
          label="פעם אחת ללקוח" hint="לפי אימייל או טלפון" />
        <Toggle checked={form.active} onChange={v => set('active', v)}
          label="פעיל" hint="כבוי = הקוד לא עובד, בלי למחוק אותו" />
      </div>

      {error && <p role="alert" className="text-sm text-redcard">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="bg-turf px-5 py-2 text-sm font-bold text-pitch disabled:opacity-50">
          {saving ? 'שומר...' : 'שמירה'}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-varnish">ביטול</button>
      </div>
    </form>
  );
}

export default function ManageCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | coupon id
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setCoupons(await base44.entities.Coupon.list('-created_date', 200));
      setLoadError('');
    } catch {
      setLoadError('לא הצלחנו לטעון את הקופונים. אם עוד לא הרצת את הקובץ supabase/coupons.sql ב-Supabase, זו הסיבה.');
    }
    setLoading(false);
  }

  const save = async (form) => {
    const code = normalizeCode(form.code);
    if (!code) { setSaveError('חסר קוד'); return; }
    const value = Number(form.discount_value);
    if (!(value > 0)) { setSaveError('חסר גובה ההנחה'); return; }
    if (form.discount_type === 'percent' && value > 100) { setSaveError('אי אפשר יותר מ-100%'); return; }
    if (form.starts_at && form.ends_at && new Date(form.ends_at) <= new Date(form.starts_at)) {
      setSaveError('תאריך הסיום צריך להיות אחרי תאריך ההתחלה'); return;
    }
    if (coupons.some(c => c.code === code && c.id !== editing)) { setSaveError('כבר יש קופון עם הקוד הזה'); return; }

    const row = {
      code,
      description: form.description.trim(),
      active: form.active,
      discount_type: form.discount_type,
      discount_value: value,
      max_discount: form.discount_type === 'percent' ? numberOrNull(form.max_discount) : null,
      applies_to: form.applies_to,
      min_items: Number(form.min_items) || 0,
      min_total: Number(form.min_total) || 0,
      starts_at: fromLocalInput(form.starts_at),
      ends_at: fromLocalInput(form.ends_at),
      max_uses: numberOrNull(form.max_uses),
      once_per_customer: form.once_per_customer,
      exclude_sale_items: form.exclude_sale_items,
    };

    setSaving(true);
    setSaveError('');
    try {
      if (editing === 'new') await base44.entities.Coupon.create(row);
      else await base44.entities.Coupon.update(editing, row);
      setEditing(null);
      await load();
    } catch {
      setSaveError('השמירה נכשלה. נסה שוב.');
    }
    setSaving(false);
  };

  const remove = async (c) => {
    if (!window.confirm(`למחוק את הקופון ${c.code}? הפעולה בלתי הפיכה. כדי רק לעצור אותו אפשר לכבות אותו.`)) return;
    await base44.entities.Coupon.delete(c.id);
    setCoupons(prev => prev.filter(x => x.id !== c.id));
  };

  const toggleActive = async (c) => {
    await base44.entities.Coupon.update(c.id, { active: !c.active });
    setCoupons(prev => prev.map(x => (x.id === c.id ? { ...x, active: !c.active } : x)));
  };

  const copy = async (code) => {
    try { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(''), 2000); } catch { /* ignore */ }
  };

  const formFor = (c) => (c ? {
    ...EMPTY,
    ...c,
    description: c.description || '',
    discount_value: c.discount_value ?? '',
    max_discount: c.max_discount ?? '',
    min_items: c.min_items || '',
    min_total: Number(c.min_total) || '',
    max_uses: c.max_uses ?? '',
    starts_at: toLocalInput(c.starts_at),
    ends_at: toLocalInput(c.ends_at),
  } : EMPTY);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-black text-turf">קופונים</h1>
        {editing === null && (
          <button onClick={() => { setEditing('new'); setSaveError(''); }} className="flex items-center gap-1 bg-turf px-4 py-2 text-sm font-bold text-pitch">
            <Plus className="h-4 w-4" /> קופון חדש
          </button>
        )}
      </div>

      <p className="mb-6 text-sm leading-relaxed text-varnish">
        הלקוח מקליד את הקוד בסל. ההנחה יורדת מהמחיר של כל פריט שהיא חלה עליו, ובהזמנה שמגיעה אליך כתוב ליד הפריט איזה קוד נוצל וכמה ירד.
        בכל הזמנה אפשר קופון אחד.
      </p>

      {loadError && <p role="alert" className="mb-6 border border-redcard/40 bg-redcard/10 p-3 text-sm text-redcard">{loadError}</p>}

      {editing === 'new' && (
        <CouponForm initial={EMPTY} onSave={save} onCancel={() => setEditing(null)} saving={saving} error={saveError} />
      )}

      <div className="space-y-2">
        {coupons.map(c => {
          if (editing === c.id) {
            return <CouponForm key={c.id} initial={formFor(c)} onSave={save} onCancel={() => setEditing(null)} saving={saving} error={saveError} />;
          }
          const s = status(c);
          return (
            <div key={c.id} className="border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Ticket className="h-4 w-4 text-turf" />
                <span dir="ltr" className="font-heading text-lg font-bold tracking-wide">{c.code}</span>
                <button onClick={() => copy(c.code)} className="text-varnish hover:text-turf" aria-label="העתקת הקוד">
                  {copied === c.code ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => toggleActive(c)} className={`text-xs font-bold ${s.tone}`} title="הפעלה / כיבוי">
                  ● {s.label}
                </button>
                <span className="ms-auto flex gap-3">
                  <button onClick={() => { setEditing(c.id); setSaveError(''); }} className="text-varnish hover:text-turf" aria-label="עריכה"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => remove(c)} className="text-varnish hover:text-redcard" aria-label="מחיקה"><Trash2 className="h-4 w-4" /></button>
                </span>
              </div>
              <p className="mt-2 text-sm text-chalk">{summary(c)}</p>
              <p className="mt-1 text-xs text-varnish">
                נוצל {c.uses || 0}{c.max_uses ? ` מתוך ${c.max_uses}` : ''} פעמים
                {c.ends_at && ` · עד ${formatDate(c.ends_at)}`}
                {c.description && ` · ${c.description}`}
              </p>
            </div>
          );
        })}
      </div>

      {!loadError && coupons.length === 0 && editing === null && (
        <p className="py-8 text-center text-varnish">עוד אין קופונים. לחץ על "קופון חדש" כדי ליצור את הראשון.</p>
      )}
    </div>
  );
}
