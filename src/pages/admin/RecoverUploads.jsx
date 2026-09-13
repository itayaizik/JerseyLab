import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Trash2, Check, ArrowRight, Search, History, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabase';

// Photos that were uploaded but never attached to anything.
//
// Uploading a photo in the shirt editor used to put the file in storage at
// once but tie it to the shirt only on "שמור הכל", so a crash in between left
// the file with nothing pointing at it. This lists every such upload from the
// last week - oldest first, which is the order they were added in - and
// attaches each one to a shirt with one press, saved immediately.
//
// "Attached to nothing" means no shirt, site setting (the home banner), category
// card or chat screenshot mentions the file.

const BUCKET = 'shirt-images';
const DAYS = 7;

const normalize = (text) => String(text || '').toLowerCase().replace(/['"׳״`]/g, '').replace(/\s+/g, ' ').trim();

function timeLabel(iso) {
  const d = new Date(iso);
  return `${d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
}

function OrphanCard({ file, shirts, busy, onAttach, onDelete }) {
  const [query, setQuery] = useState('');
  const q = normalize(query);
  // With nothing typed, the shirts still missing a photo come first.
  const matches = (q
    ? shirts.filter(s => normalize(s.name).includes(q))
    : shirts.filter(s => !s.main_image)
  ).slice(0, 6);

  return (
    <div className="border border-white/10 bg-white/5 p-3 flex flex-col gap-3">
      <a href={file.url} target="_blank" rel="noopener noreferrer" className="block bg-white">
        <img src={file.url} alt="" loading="lazy" className="h-44 w-full object-contain" />
      </a>
      <div className="flex items-center justify-between text-[11px] text-varnish">
        <span className="font-mono" dir="ltr">{timeLabel(file.created_at)}</span>
        <span className="font-mono" dir="ltr">{Math.round((file.size || 0) / 1024)}KB</span>
      </div>

      <div className="relative">
        <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-varnish pointer-events-none" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="חיפוש החולצה של התמונה..."
          className="w-full bg-pitch border border-white/20 pr-7 pl-2 py-2 text-xs text-chalk focus:outline-none focus:border-turf" />
      </div>

      <ul className="space-y-1">
        {matches.map(shirt => (
          <li key={shirt.id} className="flex items-center gap-1.5">
            <span className="flex-1 min-w-0 truncate text-xs text-chalk" title={shirt.name}>
              {shirt.name}
              {!shirt.main_image && <span className="text-amber-400"> · בלי תמונה</span>}
            </span>
            <button type="button" disabled={busy} onClick={() => onAttach(file, shirt, 'main')}
              className="px-2 py-1 text-[11px] font-bold bg-turf text-pitch disabled:opacity-40">ראשית</button>
            <button type="button" disabled={busy} onClick={() => onAttach(file, shirt, 'extra')}
              className="px-2 py-1 text-[11px] border border-turf/50 text-turf disabled:opacity-40">נוספת</button>
          </li>
        ))}
        {matches.length === 0 && <li className="text-xs text-varnish">לא נמצאו חולצות</li>}
      </ul>

      <button type="button" disabled={busy} onClick={() => onDelete(file)}
        className="mt-auto flex items-center justify-center gap-1 text-[11px] text-varnish hover:text-redcard disabled:opacity-40">
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} מחיקת התמונה
      </button>
    </div>
  );
}

export default function RecoverUploads() {
  const [files, setFiles] = useState([]);
  const [shirts, setShirts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyName, setBusyName] = useState(null);
  const [done, setDone] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [listing, allShirts, settings, cards, proofs] = await Promise.all([
        supabase.storage.from(BUCKET).list('', { limit: 1000, sortBy: { column: 'created_at', order: 'asc' } }),
        base44.entities.Shirt.list('-created_date', 1000),
        base44.entities.SiteSetting.list('-created_date', 200).catch(() => []),
        base44.entities.CategoryCard.list('sort_order', 200).catch(() => []),
        base44.entities.ChatProof.list('sort_order', 200).catch(() => []),
      ]);
      if (listing.error) throw listing.error;

      const referenced = JSON.stringify([allShirts, settings, cards, proofs]);
      const since = Date.now() - DAYS * 24 * 60 * 60 * 1000;
      const orphans = (listing.data || [])
        // Folders come back without an id or metadata.
        .filter(f => f.id && f.metadata && new Date(f.created_at).getTime() > since && !referenced.includes(f.name))
        .map(f => ({
          name: f.name,
          created_at: f.created_at,
          size: f.metadata?.size || 0,
          url: supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
        }));

      setFiles(orphans);
      setShirts([...allShirts].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he')));
    } catch (err) {
      setError(err?.message || 'הטעינה נכשלה');
    }
    setLoading(false);
  }

  const attach = async (file, shirt, kind) => {
    setBusyName(file.name);
    setError('');
    try {
      const patch = kind === 'main'
        ? { main_image: file.url }
        : { extra_images: [...(Array.isArray(shirt.extra_images) ? shirt.extra_images : []), file.url] };
      await base44.entities.Shirt.update(shirt.id, patch);
      setShirts(prev => prev.map(s => (s.id === shirt.id ? { ...s, ...patch } : s)));
      setFiles(prev => prev.filter(f => f.name !== file.name));
      setDone(prev => [{ url: file.url, shirtName: shirt.name, kind }, ...prev]);
    } catch (err) {
      setError(`השיוך נכשל: ${err?.message || 'שגיאה'}`);
    } finally {
      setBusyName(null);
    }
  };

  const remove = async (file) => {
    if (!window.confirm('למחוק את התמונה הזו לצמיתות?')) return;
    setBusyName(file.name);
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([file.name]);
    if (removeError) setError(`המחיקה נכשלה: ${removeError.message}`);
    else setFiles(prev => prev.filter(f => f.name !== file.name));
    setBusyName(null);
  };

  return (
    <div>
      <Link to="/admin/shirts" className="flex items-center gap-1 text-sm text-varnish hover:text-turf mb-4">
        <ArrowRight className="w-4 h-4" /> חזרה לחולצות
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="font-heading font-black text-2xl text-turf flex items-center gap-2">
          <History className="w-6 h-6" /> שחזור תמונות
        </h1>
        <button type="button" onClick={load} disabled={loading}
          className="flex items-center gap-1 border border-white/15 px-3 py-2 text-xs text-varnish hover:text-chalk disabled:opacity-40">
          <RotateCcw className="w-3.5 h-3.5" /> רענון
        </button>
      </div>
      <p className="text-sm text-varnish mb-6 max-w-3xl">
        תמונות שהועלו בשבוע האחרון ולא מחוברות לשום חולצה, למשל כי העריכה נקטעה לפני שמירה. הן מסודרות לפי סדר ההעלאה.
        חפש את החולצה של כל תמונה ולחץ "ראשית" או "נוספת". השיוך נשמר מיד.
      </p>

      {error && <p className="mb-4 text-sm text-redcard">{error}</p>}

      {done.length > 0 && (
        <div className="mb-6 border border-turf/30 bg-turf/5 p-3">
          <p className="text-xs text-turf font-bold mb-2 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> שויכו {done.length} תמונות</p>
          <ul className="flex flex-wrap gap-2">
            {done.map(d => (
              <li key={d.url} className="flex items-center gap-2 bg-white/5 pl-2 text-[11px] text-chalk">
                <img src={d.url} alt="" className="h-8 w-8 object-cover bg-white" />
                {d.shirtName} ({d.kind === 'main' ? 'ראשית' : 'נוספת'})
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-turf" /></div>
      ) : files.length === 0 ? (
        <p className="text-center py-12 text-varnish">אין תמונות שממתינות לשיוך.</p>
      ) : (
        <>
          <p className="text-xs text-varnish mb-3">{files.length} תמונות ממתינות</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {files.map(file => (
              <OrphanCard key={file.name} file={file} shirts={shirts} busy={busyName === file.name}
                onAttach={attach} onDelete={remove} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
