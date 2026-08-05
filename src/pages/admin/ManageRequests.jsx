import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Phone, ExternalLink, Plus, X, Package, Trash2, Copy, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { buildSupplierLine } from '@/lib/supplierText';

export default function ManageRequests() {
  const [requests, setRequests] = useState([]);
  const [shirts, setShirts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [addItemState, setAddItemState] = useState({}); // { [groupKey]: { shirtId, note, saving } }
  const [copiedId, setCopiedId] = useState(null);

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

  const handleCopySupplierText = async (groupKey, groupItems) => {
    const lines = groupItems.map(r => buildSupplierLine(r, shirts.find(s => s.id === r.shirt_id)));
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopiedId(groupKey);
    setTimeout(() => setCopiedId(k => (k === groupKey ? null : k)), 1500);
  };

  const handleMarkShirtSold = async (shirtId) => {
    await base44.entities.Shirt.update(shirtId, { status: 'sold' });
    setShirts(p => p.map(s => s.id === shirtId ? { ...s, status: 'sold' } : s));
  };

  const handleAddExtraItem = async (groupKey, firstItem) => {
    const state = addItemState[groupKey];
    if (!state?.shirtId) return;
    const shirt = shirts.find(s => s.id === state.shirtId);
    if (!shirt) return;

    setAddItemState(p => ({ ...p, [groupKey]: { ...p[groupKey], saving: true } }));

    const extraLine = `\n[פריט נוסף שנמכר: ${shirt.name}${state.note ? ' — ' + state.note : ''}]`;
    const updatedMessage = (firstItem.message || '') + extraLine;
    await base44.entities.InterestRequest.update(firstItem.id, { message: updatedMessage });

    const confirmSold = window.confirm(`לסמן את "${shirt.name}" כנמכרה גם כן?`);
    if (confirmSold) {
      await base44.entities.Shirt.update(shirt.id, { status: 'sold' });
      setShirts(p => p.map(s => s.id === shirt.id ? { ...s, status: 'sold' } : s));
    }

    setRequests(p => p.map(r => r.id === firstItem.id ? { ...r, message: updatedMessage } : r));
    setAddItemState(p => ({ ...p, [groupKey]: {} }));
    setExpandedId(null);
  };

  const filtered = requests.filter(r => !statusFilter || r.status === statusFilter);
  const statusColors = { new: 'bg-turf text-pitch', contacted: 'bg-blue-500/20 text-blue-400', closed: 'bg-white/5 text-varnish' };
  const statusLabels = { new: 'חדש', contacted: 'נוצר קשר', closed: 'סגור' };

  // Every item from one cart checkout shares an order_id — group them so a
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
    return Array.from(map.entries()).sort((a, b) => new Date(b[1][0].created_date) - new Date(a[1][0].created_date));
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
          const isExpanded = expandedId === groupKey;
          const itemState = addItemState[groupKey] || {};

          return (
            <div key={groupKey} className="border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 font-bold ${statusColors[first.status]}`}>
                      {statusLabels[first.status]}
                    </span>
                    <span className="text-xs text-varnish font-mono">{new Date(first.created_date).toLocaleDateString('he-IL')}</span>
                    {items.length > 1 && (
                      <span className="text-xs px-2 py-0.5 bg-turf/10 text-turf font-bold">{items.length} פריטים בהזמנה</span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-sm mb-2">{first.full_name}</h3>

                  {/* One block per item in this order */}
                  <div className="space-y-2 mb-2">
                    {items.map(r => {
                      const reqShirt = shirts.find(s => s.id === r.shirt_id);
                      return (
                        <div key={r.id} className={items.length > 1 ? 'border-r-2 border-turf/30 pr-2' : ''}>
                          <p className="text-sm text-varnish">
                            חולצה: <Link to={`/shirt/${r.shirt_id}`} className="text-turf hover:underline">{r.shirt_name || 'צפה'}</Link>
                            {r.wanted_size && <> • מידה: {r.wanted_size}</>}
                          </p>
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
                              <span className="line-through">{reqShirt.name}</span> — נמכרה ✓
                            </span>
                          )}
                          {r.message && <p className="text-xs text-varnish bg-white/5 p-2 mt-1 whitespace-pre-line">{r.message}</p>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-varnish">
                    {first.phone && <a href={`tel:${first.phone}`} className="flex items-center gap-1 hover:text-chalk"><Phone className="w-3 h-3" />{first.phone}</a>}
                    {first.whatsapp && <a href={`https://wa.me/${first.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-green-400"><MessageCircle className="w-3 h-3" />WhatsApp</a>}
                    {first.instagram && <a href={`https://instagram.com/${first.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-pink-400"><ExternalLink className="w-3 h-3" />{first.instagram}</a>}
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <select value={first.status} onChange={e => handleStatusChange(items, e.target.value)}
                    className="bg-white/5 border border-white/10 px-3 py-2 text-xs text-chalk focus:outline-none">
                    <option value="new">חדש</option>
                    <option value="contacted">נוצר קשר</option>
                    <option value="closed">סגור</option>
                  </select>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : groupKey)}
                    className="flex items-center gap-1 text-xs text-turf hover:text-chalk border border-turf/40 hover:border-turf px-2 py-1.5 transition-colors"
                  >
                    {isExpanded ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {isExpanded ? 'ביטול' : 'הוסף פריט'}
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

              {/* Add Extra Item Panel */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  <p className="text-xs text-varnish font-heading uppercase tracking-wide">הוסף פריט שנמכר ללקוח זה</p>
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <select
                      value={itemState.shirtId || ''}
                      onChange={e => setAddItemState(p => ({ ...p, [groupKey]: { ...p[groupKey], shirtId: e.target.value } }))}
                      className="flex-1 bg-pitch border border-white/20 px-3 py-2 text-xs text-chalk focus:outline-none focus:border-turf"
                    >
                      <option value="">בחר חולצה...</option>
                      {shirts.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}{s.status === 'sold' ? ' ✓' : ''} — ₪{s.sale_price && s.sale_price < s.price ? s.sale_price : s.price}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="הערה (אופציונלי)"
                      value={itemState.note || ''}
                      onChange={e => setAddItemState(p => ({ ...p, [groupKey]: { ...p[groupKey], note: e.target.value } }))}
                      className="flex-1 bg-pitch border border-white/20 px-3 py-2 text-xs text-chalk focus:outline-none focus:border-turf placeholder-varnish"
                    />
                    <button
                      onClick={() => handleAddExtraItem(groupKey, first)}
                      disabled={!itemState.shirtId || itemState.saving}
                      className="px-4 py-2 bg-turf text-pitch text-xs font-bold font-heading uppercase disabled:opacity-40 whitespace-nowrap"
                    >
                      {itemState.saving ? 'שומר...' : 'הוסף'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {groups.length === 0 && <p className="text-center py-12 text-varnish">אין בקשות</p>}
    </div>
  );
}
