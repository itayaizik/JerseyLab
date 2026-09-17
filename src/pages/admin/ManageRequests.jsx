import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Phone, Mail, ExternalLink, Package, Trash2, Copy, Check, Pencil, History, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { buildSupplierLine } from '@/lib/supplierText';
import { formatDate, dateSortValue } from '@/lib/dates';
import { parseEditLog, parseOrderItem } from '@/lib/orderItems';
import OrderEditor, { NotifyCustomerPanel } from '@/components/admin/OrderEditor';

// The order's total from each item's final price, and what coupons took off.
// A coupon is written into each discounted item as "קופון: CODE (-₪N)".
const COUPON_RE = /^קופון:s*(.+?)s*(-₪s*(d+(?:.d+)?))$/;

function orderSummary(items) {
  let total = 0;
  let unpriced = 0;
  const coupons = new Map();
  for (const r of items) {
    const parsed = parseOrderItem(r);
    if (parsed.price === null) unpriced += 1;
    else total += parsed.price;
    for (const part of parsed.other) {
      const m = part.match(COUPON_RE);
      if (m) coupons.set(m[1], (coupons.get(m[1]) || 0) + Number(m[2]));
    }
  }
  const discount = [...coupons.values()].reduce((a, b) => a + b, 0);
  return { total, unpriced, discount, coupons: [...coupons.entries()] };
}

function OrderSummary({ items }) {
  const { total, unpriced, discount, coupons } = orderSummary(items);
  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-white/10 pt-2 text-sm">
      <span className="font-heading font-bold text-chalk">
        סה"כ <span className="font-mono text-turf">₪{total}</span>
      </span>
      {discount > 0 && (
        <>
          <span className="text-xs text-varnish">לפני הנחה <span className="font-mono">₪{total + discount}</span></span>
          {coupons.map(([code, amount]) => (
            <span key={code} className="text-xs text-green-400">
              קופון {code}: <span className="font-mono">-₪{amount}</span>
            </span>
          ))}
        </>
      )}
      {unpriced > 0 && (
        <span className="text-xs text-amber-400">{unpriced === 1 ? 'פריט אחד בלי מחיר' : `${unpriced} פריטים בלי מחיר`}</span>
      )}
    </div>
  );
}

export default function ManageRequests() {
  const [requests, setRequests] = useState([]);
  const [shirts, setShirts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [notice, setNotice] = useState(null); // { groupKey, payload } after an edit is saved
  const [copiedId, setCopiedId] = useState(null);
  const [copiedImageId, setCopiedImageId] = useState(null);

  const loadRequests = async () => {
    const data = await base44.entities.InterestRequest.list('-created_date', 200);
    setRequests(data);
  };

  useEffect(() => {
    async function load() {
      const [data, allShirts] = await Promise.all([
        base44.entities.InterestRequest.list('-created_date', 200),
        base44.entities.Shirt.list('-created_date', 500),
      ]);
      setRequests(data);
      setShirts(allShirts.filter(s => s.status !== 'hidden'));
      setLoading(false);
    }
    load();
  }, []);

  const handleStatusChange = async (groupItems, status) => {
    const ids = groupItems.map(r => r.id);
    await Promise.all(ids.map(id => base44.entities.InterestRequest.update(id, { status })));
    setRequests(p => p.map(r => ids.includes(r.id) ? { ...r, status } : r));
  };

  const handleDeleteGroup = async (groupItems) => {
    const label = groupItems.length > 1 ? `כל ${groupItems.length} הפריטים בהזמנה הזו` : 'ההזמנה הזו';
    if (!window.confirm(`למחוק את ${label}? הפעולה בלתי הפיכה.`)) return;
    const ids = groupItems.map(r => r.id);
    await Promise.all(ids.map(id => base44.entities.InterestRequest.delete(id)));
    setRequests(p => p.filter(r => !ids.includes(r.id)));
  };

  // Numbered when the order has more than one shirt, and each shirt below
  // carries the same number, so the supplier can match a photo to its line.
  const handleCopySupplierText = async (groupKey, groupItems) => {
    const lines = groupItems.map(r => buildSupplierLine(r, shirts.find(s => s.id === r.shirt_id)));
    const text = lines.length > 1 ? lines.map((line, i) => `${i + 1}. ${line}`).join('\n') : lines.join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedId(groupKey);
    setTimeout(() => setCopiedId(k => (k === groupKey ? null : k)), 1500);
  };

  // Copies one shirt's photo, to paste into the chat with the supplier after
  // the text. A clipboard holds one image at a time, so it is one button per
  // shirt rather than one for the whole order.
  //
  // The ClipboardItem is created inside the click with the PNG as a promise:
  // Safari refuses a clipboard write that starts after an await. Chrome only
  // takes PNG, so JPEG and WebP photos are redrawn as PNG first. Where the
  // browser cannot copy images at all, the photo opens so it can be saved or
  // shared from there.
  const handleCopyImage = (requestId, imageUrl) => {
    const toPng = async () => {
      const response = await fetch(imageUrl, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bitmap = await createImageBitmap(await response.blob());
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext('2d').drawImage(bitmap, 0, 0);
      return new Promise((resolve, reject) =>
        canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('png failed'))), 'image/png'));
    };

    const markCopied = () => {
      setCopiedImageId(requestId);
      setTimeout(() => setCopiedImageId(k => (k === requestId ? null : k)), 1500);
    };

    try {
      if (!window.ClipboardItem || !navigator.clipboard?.write) throw new Error('no image clipboard');
      navigator.clipboard.write([new ClipboardItem({ 'image/png': toPng() })])
        .then(markCopied)
        .catch(() => window.open(imageUrl, '_blank', 'noopener'));
    } catch {
      window.open(imageUrl, '_blank', 'noopener');
    }
  };

  const handleMarkShirtSold = async (shirtId) => {
    await base44.entities.Shirt.update(shirtId, { status: 'sold' });
    setShirts(p => p.map(s => s.id === shirtId ? { ...s, status: 'sold' } : s));
  };

  const handleSaved = async (groupKey, payload) => {
    setEditingKey(null);
    await loadRequests();
    setNotice({ groupKey, payload });
  };

  const filtered = requests.filter(r => !statusFilter || r.status === statusFilter);
  const statusColors = { new: 'bg-turf text-pitch', contacted: 'bg-blue-500/20 text-blue-400', closed: 'bg-white/5 text-varnish' };
  const statusLabels = { new: 'חדש', contacted: 'נוצר קשר', closed: 'סגור' };

  // Every item from one cart checkout shares an order_id - group them so a
  // 3-shirt order shows as one folder, not three disconnected requests.
  // Older rows (or a single "אני מעוניין" from before this existed) have no
  // order_id and just fall back to being their own group of one.
  const groups = useMemo(() => {
    const map = new Map();
    for (const r of filtered) {
      const key = r.order_id || r.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    return Array.from(map.entries()).sort((a, b) => dateSortValue(b[1][0].created_date) - dateSortValue(a[1][0].created_date));
  }, [filtered]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="font-heading font-black text-2xl mb-6 text-turf flex items-center gap-2">
        <MessageCircle className="w-6 h-6" />
        הזמנות
      </h1>

      <div className="flex gap-3 mb-6">
        {['', 'new', 'contacted', 'closed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-bold transition-colors ${statusFilter === s ? 'bg-turf text-pitch' : 'text-varnish hover:text-chalk'}`}>
            {s === '' ? 'הכל' : statusLabels[s]} {s && `(${requests.filter(r => r.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {groups.map(([groupKey, items]) => {
          const first = items[0];
          const isEditing = editingKey === groupKey;
          const history = items
            .flatMap(r => parseEditLog(r.edit_log))
            .sort((a, b) => String(a.at).localeCompare(String(b.at)));

          return (
            <div key={groupKey} className="border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 font-bold ${statusColors[first.status]}`}>
                      {statusLabels[first.status]}
                    </span>
                    <span className="text-xs text-varnish font-mono">{formatDate(first.created_date, 'ללא תאריך')}</span>
                    {items.length > 1 && (
                      <span className="text-xs px-2 py-0.5 bg-turf/10 text-turf font-bold">{items.length} פריטים בהזמנה</span>
                    )}
                    {history.length > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-amber-500/15 text-amber-400 font-bold">נערכה</span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-sm mb-2">{first.full_name}</h3>

                  {/* One block per item in this order */}
                  <div className="space-y-2 mb-2">
                    {items.map((r, index) => {
                      const reqShirt = shirts.find(s => s.id === r.shirt_id);
                      return (
                        <div key={r.id} className={items.length > 1 ? 'border-r-2 border-turf/30 pr-2' : ''}>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <p className="text-sm text-varnish">
                              {items.length > 1 && <span className="font-mono text-turf">{index + 1}. </span>}
                              חולצה: <Link to={`/shirt/${r.shirt_id}`} className="text-turf hover:underline">{r.shirt_name || 'צפה'}</Link>
                              {r.wanted_size && <> • מידה: {r.wanted_size}</>}
                            </p>
                            {reqShirt?.main_image && (
                              <button
                                onClick={() => handleCopyImage(r.id, reqShirt.main_image)}
                                className="flex items-center gap-1 text-xs text-turf hover:text-chalk border border-turf/40 hover:border-turf px-2 py-1 transition-colors"
                              >
                                {copiedImageId === r.id ? <Check className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                                {copiedImageId === r.id ? 'התמונה הועתקה!' : 'העתקת תמונה'}
                              </button>
                            )}
                          </div>
                          {reqShirt && reqShirt.status === 'available' && (
                            <button
                              onClick={() => handleMarkShirtSold(reqShirt.id)}
                              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-1"
                            >
                              <Package className="w-3 h-3" />
                              סמן "{reqShirt.name}" כנמכרה
                            </button>
                          )}
                          {reqShirt && reqShirt.status === 'sold' && (
                            <span className="text-xs text-varnish flex items-center gap-1 mt-1">
                              <Package className="w-3 h-3" />
                              <span className="line-through">{reqShirt.name}</span> - נמכרה ✓
                            </span>
                          )}
                          {r.message && <p className="text-xs text-varnish bg-white/5 p-2 mt-1 whitespace-pre-line">{r.message}</p>}
                        </div>
                      );
                    })}
                  </div>

                  <OrderSummary items={items} />

                  <div className="flex flex-wrap gap-3 text-xs text-varnish items-center">
                    {first.phone && <a href={`tel:${first.phone}`} className="flex items-center gap-1 hover:text-chalk"><Phone className="w-3 h-3" />{first.phone}</a>}
                    {first.email && <a href={`mailto:${first.email}`} className="flex items-center gap-1 hover:text-chalk"><Mail className="w-3 h-3" />{first.email}</a>}
                    {first.whatsapp && <a href={`https://wa.me/${first.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-green-400"><MessageCircle className="w-3 h-3" />WhatsApp</a>}
                    {first.instagram && <a href={`https://instagram.com/${first.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-pink-400"><ExternalLink className="w-3 h-3" />{first.instagram}</a>}
                  </div>

                  {/* Channel the customer asked to be reached on, with the handle
                      to reach them at - this is the one they actually chose. */}
                  {first.contact_channel && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-varnish">להחזיר תשובה ב:</span>
                      {first.contact_channel === 'instagram' ? (
                        <a href={`https://instagram.com/${(first.instagram_handle || '').replace('@', '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 bg-pink-500/15 border border-pink-400/40 text-pink-300 hover:bg-pink-500/25">
                          <ExternalLink className="w-3 h-3" />
                          @{(first.instagram_handle || '').replace('@', '') || '-'}
                        </a>
                      ) : (
                        <a href={`https://wa.me/${(first.phone || '').replace(/\D/g, '').replace(/^0/, '972')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 bg-green-500/15 border border-green-400/40 text-green-300 hover:bg-green-500/25">
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  )}

                  {history.length > 0 && (
                    <details className="mt-2 text-xs text-varnish">
                      <summary className="cursor-pointer inline-flex items-center gap-1 hover:text-chalk">
                        <History className="w-3 h-3" />
                        היסטוריית עריכות ({history.length})
                      </summary>
                      <ul className="mt-2 space-y-2 border-r border-white/10 pr-3">
                        {history.map((entry, i) => (
                          <li key={i}>
                            <span className="font-mono text-white/50">{formatDate(entry.at, '')}</span>
                            <ul className="mt-0.5 space-y-0.5">
                              {entry.changes.map((change, j) => <li key={j}>• {change}</li>)}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <select value={first.status} onChange={e => handleStatusChange(items, e.target.value)}
                    className="bg-white/5 border border-white/10 px-3 py-2 text-xs text-chalk focus:outline-none">
                    <option value="new">חדש</option>
                    <option value="contacted">נוצר קשר</option>
                    <option value="closed">סגור</option>
                  </select>

                  <button
                    onClick={() => { setEditingKey(isEditing ? null : groupKey); setNotice(null); }}
                    className={`flex items-center gap-1 text-xs border px-2 py-1.5 transition-colors ${isEditing ? 'bg-turf text-pitch border-turf' : 'text-turf hover:text-chalk border-turf/40 hover:border-turf'}`}
                  >
                    <Pencil className="w-3 h-3" />
                    עריכת הזמנה
                  </button>
                  <button
                    onClick={() => handleCopySupplierText(groupKey, items)}
                    className="flex items-center gap-1 text-xs text-turf hover:text-chalk border border-turf/40 hover:border-turf px-2 py-1.5 transition-colors"
                  >
                    {copiedId === groupKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedId === groupKey ? 'הועתק!' : 'טקסט לספקית'}
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(items)}
                    className="flex items-center gap-1 text-xs text-varnish hover:text-red-400 border border-white/10 hover:border-red-400/40 px-2 py-1.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    מחק
                  </button>
                </div>
              </div>

              {isEditing && (
                <OrderEditor
                  items={items}
                  shirts={shirts}
                  onCancel={() => setEditingKey(null)}
                  onSaved={payload => handleSaved(groupKey, payload)}
                />
              )}

              {notice?.groupKey === groupKey && (
                <NotifyCustomerPanel
                  request={first}
                  orderId={groupKey}
                  payload={notice.payload}
                  onClose={() => setNotice(null)}
                />
              )}
            </div>
          );
        })}
      </div>

      {groups.length === 0 && <p className="text-center py-12 text-varnish">אין בקשות</p>}
    </div>
  );
}
