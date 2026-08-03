import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Edit, Trash2, Eye, Copy, Plus, Save, Loader2, AlertCircle, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/ui/StatusBadge';
import ShirtEditForm from '@/components/admin/ShirtEditForm';
import { hasLocalStock } from '@/components/ShippingBadge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

function shirtToDraft(s) {
  return {
    form: {
      name: s.name || '', club: s.club || '', national_team: s.national_team || '',
      league: s.league || '', season: s.season || '', player_name: s.player_name || '',
      gender_category: s.gender_category || 'men', sport_category: s.sport_category || 'football',
      price: s.price ?? '', sale_price: s.sale_price ?? '',
      condition: s.condition || 'new', description: s.description || '',
      tags: s.tags || [], status: s.status || 'available',
      featured: !!s.featured, is_new: !!s.is_new, is_rare: !!s.is_rare,
      is_retro: !!s.is_retro, best_seller: !!s.best_seller, limited_stock: !!s.limited_stock,
    },
    sizes: s.sizes || {},
    localStockSizes: s.local_stock_sizes || {},
    mainImageUrl: s.main_image || '',
    extraImageUrls: s.extra_images || [],
  };
}

function buildPayload(d) {
  return {
    ...d.form,
    price: Number(d.form.price) || 0,
    sale_price: d.form.sale_price ? Number(d.form.sale_price) : null,
    local_stock_sizes: d.localStockSizes,
    in_stock_local: hasLocalStock({ local_stock_sizes: d.localStockSizes }),
    main_image: d.mainImageUrl,
    extra_images: d.extraImageUrls,
    sizes: d.sizes,
  };
}

export default function ManageShirts() {
  const [shirts, setShirts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [drafts, setDrafts] = useState({});   // id -> draft (unsaved edits in memory)
  const [dirty, setDirty] = useState({});     // id -> true
  const [expandedId, setExpandedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { loadShirts(); }, []);

  async function loadShirts() {
    setLoading(true);
    const data = await base44.entities.Shirt.list('-created_date', 500);
    setShirts(data);
    setLoading(false);
  }

  const dirtyCount = Object.values(dirty).filter(Boolean).length;
  const dirtyIds = Object.keys(dirty).filter(k => dirty[k]);

  // Warn on accidental tab close while there are unsaved edits.
  useEffect(() => {
    const handler = (e) => { if (dirtyCount > 0) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirtyCount]);

  const filtered = shirts.filter(s => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.club?.toLowerCase().includes(search.toLowerCase()) || s.player_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id) => {
    await base44.entities.Shirt.delete(id);
    const user = await base44.auth.me();
    await base44.entities.AdminLog.create({ action: 'מחק חולצה', entity_type: 'Shirt', entity_id: id, admin_user_id: user.id });
    setShirts(p => p.filter(s => s.id !== id));
    setDrafts(p => { const n = { ...p }; delete n[id]; return n; });
    setDirty(p => { const n = { ...p }; delete n[id]; return n; });
  };

  const handleStatusChange = async (id, status) => {
    await base44.entities.Shirt.update(id, { status });
    setShirts(p => p.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleDuplicate = async (shirt) => {
    const { id, created_date, updated_date, created_by_id, views_count, interest_count, ...rest } = shirt;
    const dup = await base44.entities.Shirt.create({ ...rest, name: `${rest.name} (העתק)`, views_count: 0, interest_count: 0 });
    navigate(`/admin/edit-shirt/${dup.id}`);
  };

  const toggleEdit = (id) => {
    setExpandedId(prev => prev === id ? null : id);
    setDrafts(prev => prev[id] ? prev : { ...prev, [id]: shirtToDraft(shirts.find(s => s.id === id)) });
    setSaveResult(null);
  };

  const updateDraft = (id, nextDraft) => {
    setDrafts(prev => ({ ...prev, [id]: nextDraft }));
    setDirty(prev => ({ ...prev, [id]: true }));
  };

  const handleSaveAll = async () => {
    if (!dirtyIds.length) return;
    setSubmitting(true);
    setSaveResult(null);
    let user;
    try { user = await base44.auth.me(); } catch { user = null; }
    const saved = [];
    const failed = [];
    for (const sid of dirtyIds) {
      const d = drafts[sid];
      if (!d) continue;
      try {
        await base44.entities.Shirt.update(sid, buildPayload(d));
        if (user) await base44.entities.AdminLog.create({ action: 'עדכן חולצה', entity_type: 'Shirt', entity_id: sid, details: d.form.name, admin_user_id: user.id });
        saved.push(sid);
      } catch (err) {
        failed.push({ id: sid, name: d.form.name, error: err?.message || 'שגיאה' });
      }
    }
    // Reflect saved edits in the local list so the table updates immediately.
    setShirts(prev => prev.map(s => saved.includes(s.id) ? { ...s, ...buildPayload(drafts[s.id]) } : s));
    setDirty(prev => { const n = { ...prev }; saved.forEach(s => delete n[s]); return n; });
    setSaveResult({ saved: saved.length, failed });
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <h1 className="font-heading font-black text-2xl text-turf">ניהול חולצות</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {dirtyCount > 0 && (
            <span className="text-xs text-turf bg-turf/10 px-2 py-1">{dirtyCount} שינויים לא שמורים</span>
          )}
          <button
            onClick={handleSaveAll}
            disabled={submitting || dirtyCount === 0}
            className="flex items-center gap-2 bg-turf text-pitch px-4 py-2 text-sm font-heading font-bold hover:bg-turf/90 disabled:opacity-40 transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {submitting ? 'שומר...' : dirtyCount > 0 ? `שמור הכל (${dirtyCount})` : 'שמור הכל'}
          </button>
          <button onClick={() => navigate('/admin/add-shirt')} className="flex items-center gap-1 bg-white/5 border border-white/10 text-chalk px-4 py-2 text-sm font-bold hover:bg-white/10">
            <Plus className="w-4 h-4" /> הוסף חולצה
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-varnish pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חפש חולצה לפי שם, קבוצה או שחקן..."
            className="w-full bg-white/5 border border-white/10 pr-10 pl-9 py-2.5 text-sm text-chalk placeholder:text-white/30 rounded focus:border-turf focus:ring-1 focus:ring-turf/40 focus:outline-none transition-colors" />
          {search && (
            <button onClick={() => setSearch('')} aria-label="נקה חיפוש" className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-white/40 hover:text-chalk hover:bg-white/10 rounded transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:outline-none">
          <option value="">כל הסטטוסים</option>
          <option value="available">זמין</option>
          <option value="reserved">שמור</option>
          <option value="sold">נמכר</option>
          <option value="hidden">מוסתר</option>
        </select>
      </div>

      <p className="text-xs text-varnish mb-4">{filtered.length} חולצות</p>

      {saveResult && (
        <div className="mb-4 p-3 rounded border text-sm" style={{ background: saveResult.failed.length ? 'rgba(255,180,0,0.1)' : 'rgba(34,197,94,0.1)', borderColor: saveResult.failed.length ? 'rgba(255,180,0,0.3)' : 'rgba(34,197,94,0.3)' }}>
          {saveResult.saved > 0 && <p className="text-green-400 flex items-center gap-2"><Check className="w-4 h-4" /> נשמרו {saveResult.saved} חולצות בהצלחה.</p>}
          {saveResult.failed.map((f, i) => (
            <p key={i} className="text-yellow-400 flex items-center gap-2 mt-1"><AlertCircle className="w-4 h-4" /> {f.name}: {f.error}</p>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-varnish text-xs uppercase">
              <th className="text-right py-3 px-2">תמונה</th>
              <th className="text-right py-3 px-2">שם</th>
              <th className="text-right py-3 px-2 hidden md:table-cell">קבוצה</th>
              <th className="text-right py-3 px-2">מחיר</th>
              <th className="text-right py-3 px-2 hidden md:table-cell">מלאי / משלוח</th>
              <th className="text-right py-3 px-2">סטטוס</th>
              <th className="text-right py-3 px-2">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <React.Fragment key={s.id}>
                <tr className={`border-b border-white/5 hover:bg-white/5 ${expandedId === s.id ? 'bg-white/5' : ''}`}>
                  <td className="py-2 px-2">
                    <div className="w-12 h-12 bg-white/5 overflow-hidden">
                      {s.main_image ? <img src={s.main_image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-varnish text-xs">—</div>}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <button onClick={() => toggleEdit(s.id)} className="font-medium hover:text-turf transition-colors text-right">
                      {dirty[s.id] ? '● ' : ''}{s.name}
                    </button>
                    {s.player_name && <p className="text-xs text-varnish">{s.player_name}</p>}
                  </td>
                  <td className="py-2 px-2 hidden md:table-cell text-varnish">{s.club || s.national_team || '—'}</td>
                  <td className="py-2 px-2 font-mono">₪{s.sale_price && s.sale_price < s.price ? s.sale_price : s.price}</td>
                  <td className="py-2 px-2 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {s.local_stock_sizes && Object.entries(s.local_stock_sizes).filter(([, q]) => Number(q) > 0).length > 0 ? (
                        Object.entries(s.local_stock_sizes).filter(([, q]) => Number(q) > 0).map(([size, q]) => (
                          <span key={size} className="text-[10px] px-1.5 py-0.5 bg-[#1B2A4A] text-white font-heading uppercase">{size}: {q}</span>
                        ))
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#E8622A] text-white font-heading uppercase">משלוח מהיר</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <select value={s.status} onChange={e => handleStatusChange(s.id, e.target.value)}
                      className="bg-transparent border border-white/10 px-2 py-1 text-xs text-chalk focus:outline-none">
                      <option value="available">זמין</option>
                      <option value="reserved">שמור</option>
                      <option value="sold">נמכר</option>
                      <option value="hidden">מוסתר</option>
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleEdit(s.id)} className="p-1.5 hover:text-turf transition-colors" title="ערוך">
                        {expandedId === s.id ? <ChevronUp className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => handleDuplicate(s)} className="p-1.5 hover:text-turf transition-colors" title="שכפל">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a href={`/shirt/${s.id}`} target="_blank" rel="noreferrer" className="p-1.5 hover:text-turf transition-colors" title="צפה">
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="p-1.5 hover:text-redcard transition-colors" title="מחק">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-right">מחיקת חולצה</AlertDialogTitle>
                            <AlertDialogDescription className="text-right">האם למחוק את "{s.name}"? פעולה זו לא ניתנת לביטול.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-row-reverse gap-2">
                            <AlertDialogAction onClick={() => handleDelete(s.id)} className="bg-redcard text-white hover:bg-redcard/90">מחק</AlertDialogAction>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
                {expandedId === s.id && drafts[s.id] && (
                  <tr className="border-b border-white/10">
                    <td colSpan={7} className="p-4 bg-pitch/30">
                      <ShirtEditForm draft={drafts[s.id]} onChange={(next) => updateDraft(s.id, next)} />
                      <div className="flex items-center justify-between mt-4 max-w-3xl">
                        <button onClick={() => setExpandedId(null)} className="text-sm text-varnish hover:text-turf">סגור עריכה</button>
                        <span className="text-xs text-varnish">{dirty[s.id] ? 'שינויים לא שמורים — ישמרו ב"שמור הכל"' : 'אין שינויים'}</span>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && <p className="text-center py-8 text-varnish">לא נמצאו חולצות</p>}
    </div>
  );
}