import React, { useState } from 'react';
import { Trash2, Undo2, Plus, Loader2, Save, X, MessageCircle, Instagram, Mail, Copy, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { EXTRA_PRICES, PATCHES_LABEL, LONG_SLEEVE_LABEL, SHORTS_LABEL, shirtBasePrice } from '@/lib/cart';
import { sendOrderUpdate } from '@/lib/orderEmail';
import {
  parseOrderItem, buildOrderMessage, isMysteryBoxRequest, extraPrice, orderTotal,
  diffOrder, parseEditLog, customerUpdateText, whatsappLink, emailItem,
} from '@/lib/orderItems';

// Editing an order after the customer sent it: each item's size, version,
// print, patches and price, removing an item and adding one. Saving writes the
// rows back, records what changed, and hands the change list to the panel below
// so the customer can be told.

const field = 'w-full bg-pitch border border-white/20 px-2.5 py-2 text-xs text-chalk focus:outline-none focus:border-turf';

function Labelled({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[11px] text-varnish mb-1">{label}</span>
      {children}
    </label>
  );
}

function draftFromRequest(request) {
  const parsed = parseOrderItem(request);
  return {
    key: request.id,
    requestId: request.id,
    shirtId: request.shirt_id,
    name: request.shirt_name || '',
    size: request.wanted_size || '',
    playerVersion: parsed.playerVersion,
    customName: parsed.customName,
    patches: parsed.patches,
    longSleeve: parsed.longSleeve,
    shorts: parsed.shorts,
    price: parsed.price ?? '',
    removed: false,
    parsed,
    mystery: isMysteryBoxRequest(request),
  };
}

export default function OrderEditor({ items, shirts, onCancel, onSaved }) {
  const [original] = useState(() => items.map(draftFromRequest));
  const [drafts, setDrafts] = useState(() => items.map(draftFromRequest));
  const [addShirtId, setAddShirtId] = useState('');
  const [addSize, setAddSize] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (key, patch) => setDrafts(ds => ds.map(d => (d.key === key ? { ...d, ...patch } : d)));

  // Turning an option on or off moves the price by what the option costs, so
  // the common case needs no arithmetic; the price stays editable by hand.
  const setOption = (key, name, value) => setDrafts(ds => ds.map(d => {
    if (d.key !== key) return d;
    const next = { ...d, [name]: value };
    const delta = extraPrice(next) - extraPrice(d);
    if (delta && d.price !== '' && !Number.isNaN(Number(d.price))) next.price = Number(d.price) + delta;
    return next;
  }));

  const addItem = () => {
    const shirt = shirts.find(s => s.id === addShirtId);
    if (!shirt || !addSize.trim()) return;
    setDrafts(ds => [...ds, {
      key: `new-${Date.now()}`,
      requestId: null,
      shirtId: shirt.id,
      name: shirt.name,
      size: addSize.trim(),
      playerVersion: false,
      customName: '',
      patches: false,
      longSleeve: false,
      shorts: false,
      price: shirtBasePrice(shirt),
      removed: false,
      parsed: { prefix: 'סל קניות', other: [], trailing: '' },
      mystery: false,
    }]);
    setAddShirtId('');
    setAddSize('');
  };

  const active = drafts.filter(d => !d.removed);
  const total = orderTotal(drafts);

  const save = async () => {
    setError('');
    if (!active.length) {
      setError('בהזמנה חייב להישאר לפחות פריט אחד. כדי לבטל את כולה, מחקו אותה.');
      return;
    }
    if (active.some(d => !d.size.trim())) {
      setError('לכל פריט צריך מידה.');
      return;
    }
    const changes = diffOrder(original, drafts);
    if (!changes.length) { onCancel(); return; }

    setSaving(true);
    const first = items[0];
    // Orders from before grouping have no order_id; the first row's id becomes
    // it, which is also the key the admin list already groups them under.
    const orderId = first.order_id || first.id;

    try {
      for (const d of drafts.filter(x => x.requestId)) {
        if (d.removed) {
          await base44.entities.InterestRequest.delete(d.requestId);
          continue;
        }
        const row = items.find(r => r.id === d.requestId);
        const message = buildOrderMessage({
          ...d.parsed,
          playerVersion: d.playerVersion,
          customName: d.customName.trim(),
          patches: d.patches,
          longSleeve: d.longSleeve,
          shorts: d.shorts,
          price: d.price,
        }, d.mystery);
        const patch = {};
        if (message !== (row.message || '')) patch.message = message;
        if (d.size.trim() !== (row.wanted_size || '')) patch.wanted_size = d.size.trim();
        if (!row.order_id) patch.order_id = orderId;
        if (Object.keys(patch).length) await base44.entities.InterestRequest.update(d.requestId, patch);
      }

      for (const d of drafts.filter(x => !x.requestId && !x.removed)) {
        await base44.entities.InterestRequest.create({
          shirt_id: d.shirtId,
          shirt_name: d.name,
          full_name: first.full_name,
          phone: first.phone,
          email: first.email,
          contact_channel: first.contact_channel,
          instagram_handle: first.instagram_handle,
          wanted_size: d.size.trim(),
          message: buildOrderMessage({
            ...d.parsed, playerVersion: d.playerVersion, customName: d.customName.trim(), patches: d.patches,
            longSleeve: d.longSleeve, shorts: d.shorts, price: d.price,
          }),
          status: first.status || 'new',
          user_id: first.user_id || '',
          order_id: orderId,
        });
      }

      // The history lives on a row that is staying. Saving it needs the
      // edit_log column; without it the edit itself still stands.
      let historySaved = true;
      const keeper = items.find(r => drafts.some(d => d.requestId === r.id && !d.removed));
      if (keeper) {
        const log = [...parseEditLog(keeper.edit_log), { at: new Date().toISOString(), changes }];
        try {
          await base44.entities.InterestRequest.update(keeper.id, { edit_log: JSON.stringify(log) });
        } catch {
          historySaved = false;
        }
      }

      onSaved({ changes, items: active, total, historySaved });
    } catch (err) {
      setError(`השמירה נכשלה: ${err?.message || 'שגיאה לא ידועה'}. רעננו את הדף ובדקו מה נשמר.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
      <p className="text-xs text-varnish font-heading uppercase tracking-wide">עריכת הזמנה</p>

      {drafts.map((d, i) => (
        <div key={d.key} className={`border border-white/10 bg-white/[0.03] p-3 space-y-2.5 ${d.removed ? 'opacity-40' : ''}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-chalk font-bold">
              {i + 1}. {d.name}
              {!d.requestId && <span className="text-turf text-xs font-normal"> (חדש)</span>}
              {d.removed && <span className="text-red-400 text-xs font-normal"> (יוסר)</span>}
            </p>
            <button onClick={() => update(d.key, { removed: !d.removed })}
              className="flex items-center gap-1 text-xs text-varnish hover:text-chalk border border-white/15 px-2 py-1">
              {d.removed ? <><Undo2 className="w-3 h-3" /> החזרה</> : <><Trash2 className="w-3 h-3" /> הסרה</>}
            </button>
          </div>

          {!d.removed && (
            <div className="grid gap-2 grid-cols-2 lg:grid-cols-5 items-end">
              <Labelled label="מידה">
                <input value={d.size} onChange={e => update(d.key, { size: e.target.value })} dir="ltr" className={field} />
              </Labelled>
              {!d.mystery && (
                <Labelled label="גרסה">
                  <select value={d.playerVersion ? 'player' : 'regular'} onChange={e => setOption(d.key, 'playerVersion', e.target.value === 'player')} className={field}>
                    <option value="regular">רגילה</option>
                    <option value="player">{`שחקן (+₪${EXTRA_PRICES.player})`}</option>
                  </select>
                </Labelled>
              )}
              {!d.mystery && (
                <Labelled label={`הדפסת שם ומספר (+₪${EXTRA_PRICES.name})`}>
                  <input value={d.customName} onChange={e => setOption(d.key, 'customName', e.target.value)}
                    dir="ltr" placeholder="ריק = בלי הדפסה" className={field} />
                </Labelled>
              )}
              {!d.mystery && (
                <label className="flex items-center gap-2 text-xs text-chalk pb-2 cursor-pointer">
                  <input type="checkbox" checked={d.patches} onChange={e => setOption(d.key, 'patches', e.target.checked)} className="h-4 w-4 accent-[#E8622A]" />
                  {`${PATCHES_LABEL} (+₪${EXTRA_PRICES.patches})`}
                </label>
              )}
              {!d.mystery && (
                <label className="flex items-center gap-2 text-xs text-chalk pb-2 cursor-pointer">
                  <input type="checkbox" checked={!!d.longSleeve} onChange={e => setOption(d.key, 'longSleeve', e.target.checked)} className="h-4 w-4 accent-[#E8622A]" />
                  {`${LONG_SLEEVE_LABEL} (+₪${EXTRA_PRICES.longSleeve})`}
                </label>
              )}
              {!d.mystery && (
                <label className="flex items-center gap-2 text-xs text-chalk pb-2 cursor-pointer">
                  <input type="checkbox" checked={!!d.shorts} onChange={e => setOption(d.key, 'shorts', e.target.checked)} className="h-4 w-4 accent-[#E8622A]" />
                  {`${SHORTS_LABEL} (+₪${EXTRA_PRICES.shorts})`}
                </label>
              )}
              <Labelled label="מחיר (₪)">
                <input type="number" min="0" value={d.price} onChange={e => update(d.key, { price: e.target.value })} dir="ltr" className={field} />
              </Labelled>
            </div>
          )}
          {d.mystery && !d.removed && (
            <p className="text-[11px] text-white/45">מיסטרי בוקס: אפשר לשנות מידה ומחיר. שאר הבחירות נשארות כמו שהלקוח בחר.</p>
          )}
        </div>
      ))}

      <div className="border border-dashed border-white/15 p-3">
        <p className="text-[11px] text-varnish mb-2">הוספת פריט להזמנה</p>
        <div className="flex gap-2 flex-col sm:flex-row">
          <select value={addShirtId} onChange={e => setAddShirtId(e.target.value)} className={`${field} sm:flex-1`}>
            <option value="">בחר חולצה...</option>
            {shirts.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.status === 'sold' ? ' ✓' : ''} - ₪{shirtBasePrice(s)}</option>
            ))}
          </select>
          <input value={addSize} onChange={e => setAddSize(e.target.value)} placeholder="מידה" dir="ltr" className={`${field} sm:w-24`} />
          <button onClick={addItem} disabled={!addShirtId || !addSize.trim()}
            className="flex items-center justify-center gap-1 px-3 py-2 text-xs border border-turf/40 text-turf hover:border-turf disabled:opacity-40">
            <Plus className="w-3 h-3" /> הוספה
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-chalk">סה״כ אחרי העריכה: <span className="font-mono font-bold text-turf">₪{total}</span></p>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={saving}
            className="flex items-center gap-1 px-3 py-2 text-xs text-varnish border border-white/15 hover:text-chalk">
            <X className="w-3 h-3" /> ביטול
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-turf text-pitch text-xs font-bold disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'שומר...' : 'שמירת השינויים'}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// Shown after an edit is saved: the message to the customer, ready to send on
// the channel they chose, by email, or to copy.
export function NotifyCustomerPanel({ request, orderId, payload, onClose }) {
  const [text, setText] = useState(() => customerUpdateText({
    fullName: request.full_name, changes: payload.changes, items: payload.items, total: payload.total,
  }));
  const [copied, setCopied] = useState(false);
  const [mail, setMail] = useState('idle'); // idle | sending | sent | error

  const handle = (request.instagram_handle || '').replace('@', '');
  const prefersInstagram = request.contact_channel === 'instagram';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable - the text is still in the box to copy by hand */ }
  };

  // Instagram cannot take a prefilled message, so the text goes to the
  // clipboard and the conversation opens, ready for a paste.
  const openInstagram = async () => {
    await copy();
    window.open(handle ? `https://ig.me/m/${handle}` : 'https://instagram.com/direct/inbox/', '_blank', 'noopener');
  };

  const sendMail = async () => {
    setMail('sending');
    try {
      await sendOrderUpdate({
        email: request.email,
        fullName: request.full_name,
        orderId,
        changes: payload.changes,
        items: payload.items.map(emailItem),
        total: payload.total,
      });
      setMail('sent');
    } catch {
      setMail('error');
    }
  };

  const button = 'flex items-center gap-1.5 px-3 py-2 text-xs border transition-colors';

  return (
    <div className="mt-3 pt-3 border-t border-turf/30 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-turf font-heading uppercase tracking-wide">ההזמנה נשמרה. לעדכן את הלקוח?</p>
        <button onClick={onClose} aria-label="סגירה" className="text-varnish hover:text-chalk"><X className="w-4 h-4" /></button>
      </div>

      {!payload.historySaved && (
        <p className="text-[11px] text-amber-400">
          היסטוריית העריכה לא נשמרה, כי חסרה עמודה במסד הנתונים. צריך להריץ ב-Supabase:
          <span dir="ltr" className="block font-mono mt-1 text-amber-300">alter table interest_requests_raw add column if not exists edit_log text;</span>
        </p>
      )}

      <textarea value={text} onChange={e => setText(e.target.value)} rows={9} dir="rtl"
        className="w-full bg-pitch border border-white/20 px-3 py-2 text-xs text-chalk leading-relaxed focus:outline-none focus:border-turf" />

      <div className="flex flex-wrap gap-2">
        {request.phone && (
          <a href={whatsappLink(request.phone, text)} target="_blank" rel="noopener noreferrer"
            className={`${button} ${!prefersInstagram ? 'bg-green-500/20 border-green-400/60 text-green-300' : 'border-white/15 text-varnish hover:text-chalk'}`}>
            <MessageCircle className="w-3.5 h-3.5" /> שליחה בוואטסאפ
          </a>
        )}
        <button onClick={openInstagram}
          className={`${button} ${prefersInstagram ? 'bg-pink-500/20 border-pink-400/60 text-pink-300' : 'border-white/15 text-varnish hover:text-chalk'}`}>
          <Instagram className="w-3.5 h-3.5" /> העתקה ופתיחת אינסטגרם
        </button>
        {request.email && (
          <button onClick={sendMail} disabled={mail === 'sending' || mail === 'sent'}
            className={`${button} border-white/15 text-varnish hover:text-chalk disabled:opacity-60`}>
            {mail === 'sending' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : mail === 'sent' ? <Check className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
            {mail === 'sent' ? 'המייל נשלח' : mail === 'sending' ? 'שולח...' : 'שליחת מייל'}
          </button>
        )}
        <button onClick={copy} className={`${button} border-white/15 text-varnish hover:text-chalk`}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'הועתק!' : 'העתקת הטקסט'}
        </button>
      </div>

      {prefersInstagram && handle && <p className="text-[11px] text-varnish">הלקוח ביקש אינסטגרם: <span dir="ltr">@{handle}</span></p>}
      {mail === 'error' && (
        <p className="text-[11px] text-red-400">
          המייל לא נשלח. אם עוד לא העלית ל-Supabase את הפונקציה send-order-update, זו הסיבה. בינתיים אפשר לשלוח בוואטסאפ או באינסטגרם.
        </p>
      )}
      {mail === 'sent' && <p className="text-[11px] text-turf">המייל נשלח ל-<span dir="ltr">{request.email}</span>. הוא כולל את השינויים וההזמנה המעודכנת, לא את הטקסט שכאן.</p>}
    </div>
  );
}
