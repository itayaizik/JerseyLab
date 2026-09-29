import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Trash2, Upload, Loader2, Eye, EyeOff, ArrowUp, ArrowDown, ShoppingBag, Plus, X, Search, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/dates';
import { uploadErrorMessage } from '@/lib/supabaseStorage';

// Screenshots of real conversations with customers, shown on the site as
// proof that people actually buy here and get answered.
//
// Everything about them is managed from this page - upload, caption, order,
// hide, delete - so the section can be filled and changed without touching
// code. Images go to the existing shirt-images bucket, which is already
// admin-write and public-read.
//
// A screenshot on its own says someone talked to us. What a shopper wants to
// know next is what they bought, so each one can also carry an order: pick it
// here and the shirts from it appear under the screenshot on the site, each
// linking to its product page (supabase/chat_proof_orders.sql).

export default function ManageChatProofs() {
  const [proofs, setProofs] = useState([]);
  const [shirts, setShirts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  // Which proof has its attach panel open, and on which tab.
  const [attaching, setAttaching] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    // Shirts and orders come along for the attach panel. They are loaded
    // separately from the proofs so that a failure in either - an older
    // database without the new columns, say - still leaves the page usable.
    const [data, allShirts, allRequests] = await Promise.all([
      base44.entities.ChatProof.list('sort_order', 100),
      base44.entities.Shirt.list('-created_date', 500).catch(() => []),
      base44.entities.InterestRequest.list('-created_date', 300).catch(() => []),
    ]);
    setProofs(data);
    setShirts(allShirts);
    setRequests(allRequests);
    setLoading(false);
  }

  // Every item from one cart checkout shares an order_id, so a three-shirt
  // order is one entry here rather than three.
  const orders = useMemo(() => {
    const map = new Map();
    for (const r of requests) {
      const key = r.order_id || r.id;
      if (!map.has(key)) map.set(key, { key, name: r.full_name, phone: r.phone, date: r.created_date, items: [] });
      map.get(key).items.push(r);
    }
    return Array.from(map.values());
  }, [requests]);

  const shirtsById = useMemo(() => Object.fromEntries(shirts.map(s => [s.id, s])), [shirts]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setError('');
    setUploading(true);
    try {
      // New screenshots go to the end of the list.
      let nextOrder = proofs.reduce((max, p) => Math.max(max, p.sort_order || 0), 0);
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        nextOrder += 1;
        await base44.entities.ChatProof.create({
          image_url: file_url,
          caption: caption.trim(),
          sort_order: nextOrder,
          active: true,
        });
      }
      setCaption('');
      await load();
    } catch (err) {
      setError(uploadErrorMessage(err));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // One place for every edit to a single proof, so the row on screen and the
  // row in the database never disagree.
  const patch = async (proof, changes) => {
    setProofs(p => p.map(x => (x.id === proof.id ? { ...x, ...changes } : x)));
    try {
      await base44.entities.ChatProof.update(proof.id, changes);
    } catch {
      alert('לא נשמר. אם זו הפעם הראשונה שמצרפים הזמנה, צריך קודם להריץ את supabase/chat_proof_orders.sql.');
      await load();
    }
  };

  const toggleActive = (proof) => patch(proof, { active: !proof.active });

  const saveCaption = (proof, value) => {
    if (value === (proof.caption || '')) return;
    patch(proof, { caption: value });
  };

  // Replacing the picture keeps the caption, the order and the position: a
  // better-cropped screenshot of the same conversation is an edit, not a new
  // entry that has to be set up again from scratch.
  const replaceImage = async (proof, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await patch(proof, { image_url: file_url });
    } catch (err) {
      setError(uploadErrorMessage(err));
    }
  };

  const attachOrder = (proof, order) => {
    const ids = [...new Set(order.items.map(r => r.shirt_id).filter(id => id && shirtsById[id]))];
    patch(proof, { order_id: order.key, shirt_ids: ids });
    setAttaching(null);
  };

  const addShirt = (proof, shirt) => {
    const ids = proof.shirt_ids || [];
    if (ids.includes(shirt.id)) return;
    patch(proof, { shirt_ids: [...ids, shirt.id] });
  };

  const removeShirt = (proof, id) =>
    patch(proof, { shirt_ids: (proof.shirt_ids || []).filter(x => x !== id) });

  const detach = (proof) => patch(proof, { order_id: null, shirt_ids: [] });

  // Refills the shirts from the attached order, for when the order itself was
  // edited after the fact.
  const refreshFromOrder = (proof) => {
    const order = orders.find(o => o.key === proof.order_id);
    if (order) attachOrder(proof, order);
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= proofs.length) return;
    const next = [...proofs];
    [next[index], next[target]] = [next[target], next[index]];
    setProofs(next);
    await Promise.all(next.map((p, i) => base44.entities.ChatProof.update(p.id, { sort_order: i + 1 })));
  };

  const remove = async (proof) => {
    if (!window.confirm('למחוק את הצילום הזה? הפעולה בלתי הפיכה.')) return;
    await base44.entities.ChatProof.delete(proof.id);
    setProofs(p => p.filter(x => x.id !== proof.id));
  };

  const liveCount = proofs.filter(p => p.active).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-black text-2xl text-turf mb-1">צילומי שיחות</h1>
        <p className="text-sm text-varnish font-body">
          צילומי מסך של שיחות עם לקוחות. מוצגים בדף הבית כהוכחה חברתית.
          {proofs.length > 0 && ` ${liveCount} מוצגים מתוך ${proofs.length}.`}
        </p>
      </div>

      {/* Privacy is the shop's call, but it is worth saying once, here, where
          the screenshots are actually chosen. */}
      <div className="border-2 border-brand-orange/50 bg-brand-orange/10 p-4 mb-6">
        <p className="text-sm text-chalk font-body leading-relaxed">
          <strong>לפני שמעלים:</strong> טשטש שם מלא, מספר טלפון ותמונת פרופיל של הלקוח.
          צילום שיחה הוא מידע אישי שלו, לא שלך, וברגע שהוא באתר הוא פומבי לגמרי.
        </p>
      </div>

      {/* Upload */}
      <div className="border border-white/10 bg-white/5 p-4 mb-6 space-y-3">
        <div>
          <label htmlFor="cp-caption" className="text-sm text-varnish block mb-1">
            כיתוב (לא חובה, אפשר לערוך אחר כך)
          </label>
          <input id="cp-caption" value={caption} onChange={e => setCaption(e.target.value)} maxLength={140}
            placeholder="למשל: לקוח מתל אביב קיבל את החולצה תוך 5 ימים"
            className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
        </div>

        <label className={`flex items-center justify-center gap-2 border-2 border-dashed border-white/25 py-6 cursor-pointer hover:border-turf transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
          {uploading ? <Loader2 className="w-5 h-5 animate-spin text-turf" /> : <Upload className="w-5 h-5 text-varnish" />}
          <span className="text-sm text-varnish font-body">
            {uploading ? 'מעלה…' : 'בחר צילומי מסך (אפשר כמה בבת אחת)'}
          </span>
          <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
        {error && <p className="text-redcard text-sm">{error}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" />
        </div>
      ) : proofs.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-white/15">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-white/20" />
          <p className="text-varnish text-sm font-body">עדיין לא העלית צילומי שיחות.</p>
          <p className="text-white/40 text-xs font-body mt-1">כל עוד אין אף אחד, הקטע הזה לא מופיע באתר.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proofs.map((proof, i) => {
            const attached = (proof.shirt_ids || []).map(id => shirtsById[id]).filter(Boolean);
            const order = orders.find(o => o.key === proof.order_id);
            return (
              <div key={proof.id} className={`flex gap-4 border border-white/10 p-3 ${proof.active ? 'bg-white/5' : 'bg-white/[0.02] opacity-60'}`}>
                <div className="flex-shrink-0 flex flex-col gap-1.5">
                  <a href={proof.image_url} target="_blank" rel="noopener noreferrer">
                    <img src={proof.image_url} alt="" className="w-20 h-28 object-cover border border-white/20 hover:border-turf transition-colors" />
                  </a>
                  <label className="text-[11px] text-center text-varnish hover:text-turf cursor-pointer transition-colors">
                    החלף תמונה
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { replaceImage(proof, e.target.files?.[0]); e.target.value = ''; }} />
                  </label>
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <input
                    defaultValue={proof.caption || ''}
                    onBlur={e => saveCaption(proof, e.target.value)}
                    maxLength={140}
                    placeholder="כיתוב (נשמר כשעוזבים את השדה)"
                    className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none"
                  />
                  <p className="text-xs text-varnish font-mono">
                    {formatDate(proof.created_date)} · מיקום {i + 1}
                  </p>

                  {/* What the conversation was about */}
                  <div className="border border-white/10 bg-white/[0.03] p-2.5">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <ShoppingBag className="w-3.5 h-3.5 text-turf" />
                      <span className="text-xs font-bold text-chalk">
                        {order ? `הזמנה של ${order.name || 'לקוח'} · ${formatDate(order.date)}` : attached.length ? 'חולצות מצורפות' : 'לא מצורפת הזמנה'}
                      </span>
                      {order && (
                        <button onClick={() => refreshFromOrder(proof)} title="רענן את החולצות מההזמנה"
                          className="text-varnish hover:text-turf transition-colors">
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      )}
                      {(order || attached.length > 0) && (
                        <button onClick={() => detach(proof)} className="text-xs text-varnish hover:text-redcard transition-colors">
                          נתק
                        </button>
                      )}
                    </div>

                    {attached.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {attached.map(s => (
                          <span key={s.id} className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 pl-1.5 pr-1 py-1">
                            {s.main_image && <img src={s.main_image} alt="" className="w-6 h-6 object-cover" />}
                            <span className="text-xs text-chalk max-w-[160px] truncate">{s.name}</span>
                            <button onClick={() => removeShirt(proof, s.id)} aria-label={`הסר ${s.name}`}
                              className="text-white/40 hover:text-redcard transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => setAttaching(attaching?.id === proof.id && attaching.tab === 'order' ? null : { id: proof.id, tab: 'order' })}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-white/25 text-white/70 hover:border-turf hover:text-turf transition-colors">
                        <Search className="w-3 h-3" /> {order ? 'החלף הזמנה' : 'צרף הזמנה'}
                      </button>
                      <button onClick={() => setAttaching(attaching?.id === proof.id && attaching.tab === 'shirt' ? null : { id: proof.id, tab: 'shirt' })}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-white/25 text-white/70 hover:border-turf hover:text-turf transition-colors">
                        <Plus className="w-3 h-3" /> הוסף חולצה
                      </button>
                    </div>

                    {attaching?.id === proof.id && attaching.tab === 'order' && (
                      <OrderPicker orders={orders} shirtsById={shirtsById} onPick={o => attachOrder(proof, o)} />
                    )}
                    {attaching?.id === proof.id && attaching.tab === 'shirt' && (
                      <ShirtPicker shirts={shirts} onPick={s => addShirt(proof, s)} />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    <button onClick={() => toggleActive(proof)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-white/25 text-white/70 hover:border-turf hover:text-turf transition-colors">
                      {proof.active ? <><Eye className="w-3 h-3" /> מוצג</> : <><EyeOff className="w-3 h-3" /> מוסתר</>}
                    </button>
                    <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="הזז למעלה"
                      className="px-2 py-1.5 border border-white/25 text-white/70 hover:border-turf disabled:opacity-30 disabled:hover:border-white/25 transition-colors">
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === proofs.length - 1} aria-label="הזז למטה"
                      className="px-2 py-1.5 border border-white/25 text-white/70 hover:border-turf disabled:opacity-30 disabled:hover:border-white/25 transition-colors">
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button onClick={() => remove(proof)} aria-label="מחק"
                      className="mr-auto px-2 py-1.5 text-white/30 hover:text-redcard transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Finding the right order out of three hundred: by customer name, phone or
// the name of a shirt in it, which is usually what the screenshot shows.
function OrderPicker({ orders, shirtsById, onPick }) {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const matches = orders
    .filter(o => !needle || [o.name, o.phone, ...o.items.map(r => r.shirt_name || shirtsById[r.shirt_id]?.name)]
      .some(v => String(v || '').toLowerCase().includes(needle)))
    .slice(0, 12);

  return (
    <div className="mt-2 border border-white/10 bg-pitch/40 p-2">
      <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="חפש לפי שם, טלפון או חולצה"
        className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none mb-2" />
      {matches.length === 0 ? (
        <p className="text-xs text-varnish py-2 text-center">לא נמצאה הזמנה.</p>
      ) : (
        <ul className="space-y-1 max-h-64 overflow-y-auto">
          {matches.map(o => (
            <li key={o.key}>
              <button onClick={() => onPick(o)}
                className="w-full text-right border border-white/10 hover:border-turf px-2.5 py-2 transition-colors">
                <span className="block text-xs font-bold text-chalk">{o.name || 'ללא שם'} · {formatDate(o.date)}</span>
                <span className="block text-xs text-varnish truncate">
                  {o.items.map(r => r.shirt_name || shirtsById[r.shirt_id]?.name || 'פריט').join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// For a conversation with no order behind it in the system - most of the older
// ones - the shirts can be picked straight from the catalogue.
function ShirtPicker({ shirts, onPick }) {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const matches = shirts
    .filter(s => !needle || `${s.name} ${s.team || ''}`.toLowerCase().includes(needle))
    .slice(0, 12);

  return (
    <div className="mt-2 border border-white/10 bg-pitch/40 p-2">
      <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="חפש חולצה בקטלוג"
        className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none mb-2" />
      <ul className="space-y-1 max-h-64 overflow-y-auto">
        {matches.map(s => (
          <li key={s.id}>
            <button onClick={() => onPick(s)}
              className="w-full flex items-center gap-2 text-right border border-white/10 hover:border-turf px-2 py-1.5 transition-colors">
              {s.main_image && <img src={s.main_image} alt="" className="w-7 h-7 object-cover flex-shrink-0" />}
              <span className="text-xs text-chalk truncate">{s.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
