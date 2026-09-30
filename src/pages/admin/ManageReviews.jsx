import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Star, Check, X, Trash2, Pencil, ImageOff, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/dates';
import { uploadErrorMessage } from '@/lib/supabaseStorage';
import ShirtPicker from '@/components/admin/ShirtPicker';
import ManageChatProofs from '@/pages/admin/ManageChatProofs';

// Everything customers say about the shop, in one place: the reviews they
// write and the conversation screenshots the owner keeps. They end up in the
// same two sections on the home page, so splitting them across two admin
// pages - one of which was not even in the menu - only hid half of them.
//
// A review can be edited in full here, not just approved or deleted. The
// reason is not tidiness: an open review form takes what people type, and
// what people type has typos, missing names, the wrong shirt, and sometimes a
// photo that is better left off. Approving is a yes/no on someone else's
// words; editing is how those words become something worth publishing.

export default function ManageReviews() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'proofs' ? 'proofs' : 'reviews';
  const setTab = (next) => setParams(next === 'proofs' ? { tab: 'proofs' } : {}, { replace: true });

  const [reviews, setReviews] = useState([]);
  const [shirts, setShirts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'approved' | 'all'
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [data, allShirts] = await Promise.all([
      base44.entities.Review.list('-created_date', 200),
      base44.entities.Shirt.list('-created_date', 500),
    ]);
    setReviews(data);
    setShirts(allShirts);
    setLoading(false);
  }

  // One way in for every change to a review, so the row on screen and the row
  // in the database never disagree, and a column that does not exist yet says
  // so once instead of failing silently.
  const patch = async (review, changes) => {
    setReviews(p => p.map(r => (r.id === review.id ? { ...r, ...changes } : r)));
    try {
      await base44.entities.Review.update(review.id, changes);
      return true;
    } catch {
      alert('לא נשמר. אם זו הפעם הראשונה שמסתירים תמונה, צריך קודם להריץ את supabase/review_admin_edit.sql.');
      await load();
      return false;
    }
  };

  const handleApprove = (review, approved) => patch(review, { approved });

  // Any approved review can also be shown in "לקוחות מספרים" on the home
  // page, photo or not.
  const toggleProofs = (review) => patch(review, { show_in_proofs: !review.show_in_proofs });

  // The reviews that came in before the section could show them are the ones
  // most likely to be missing from it, and turning on twenty toggles by hand
  // is how that stays missing. One button for the lot.
  const showAllApproved = async () => {
    const missing = reviews.filter(r => r.approved && !r.show_in_proofs);
    if (!missing.length) return;
    if (!confirm(`להציג ${missing.length} ביקורות מאושרות ב"לקוחות מספרים"?`)) return;
    try {
      await Promise.all(missing.map(r => base44.entities.Review.update(r.id, { show_in_proofs: true })));
      const ids = new Set(missing.map(r => r.id));
      setReviews(p => p.map(r => (ids.has(r.id) ? { ...r, show_in_proofs: true } : r)));
    } catch {
      alert('לא נשמר. אם זו הפעם הראשונה, צריך קודם להריץ את קובץ ה-SQL (עמודה show_in_proofs).');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('למחוק את הביקורת?')) return;
    await base44.entities.Review.delete(id);
    setReviews(p => p.filter(r => r.id !== id));
  };

  const filtered = reviews.filter(r => {
    if (filter === 'pending') return !r.approved;
    if (filter === 'approved') return r.approved;
    return true;
  });

  const pendingCount = reviews.filter(r => !r.approved).length;
  const hiddenFromProofs = reviews.filter(r => r.approved && !r.show_in_proofs).length;

  return (
    <div>
      <h1 className="font-heading font-black text-2xl text-turf mb-4">ביקורות ולקוחות מספרים</h1>

      {/* The two halves of the same thing on the home page */}
      <div className="flex gap-2 border-b border-brand-line mb-6">
        {[
          { key: 'reviews', label: `ביקורות (${reviews.length})`, icon: Star },
          { key: 'proofs', label: 'צילומי שיחות', icon: MessageSquare },
        ].map(x => (
          <button key={x.key} onClick={() => setTab(x.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold font-heading border-b-2 -mb-px transition-colors ${tab === x.key ? 'border-turf text-turf' : 'border-transparent text-varnish hover:text-chalk'}`}>
            <x.icon className="w-4 h-4" /> {x.label}
          </button>
        ))}
      </div>

      {tab === 'proofs' ? <ManageChatProofs embedded /> : loading ? (
        <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
            <div className="flex gap-2">
              {[
                { key: 'pending', label: `ממתין (${pendingCount})` },
                { key: 'approved', label: 'מאושר' },
                { key: 'all', label: 'הכל' },
              ].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`text-xs px-3 py-1.5 font-bold font-heading uppercase transition-colors ${filter === f.key ? 'bg-turf text-pitch' : 'border border-brand-line text-varnish hover:text-chalk'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            {hiddenFromProofs > 0 && (
              <button onClick={showAllApproved}
                className="text-xs px-3 py-1.5 font-bold font-heading border border-turf/50 text-turf hover:bg-turf hover:text-pitch transition-colors">
                הצג {hiddenFromProofs} ב"לקוחות מספרים"
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filtered.map(r => (
              <ReviewRow
                key={r.id}
                review={r}
                shirts={shirts}
                editing={editingId === r.id}
                onEdit={() => setEditingId(editingId === r.id ? null : r.id)}
                onDone={() => setEditingId(null)}
                onPatch={changes => patch(r, changes)}
                onApprove={approved => handleApprove(r, approved)}
                onToggleProofs={() => toggleProofs(r)}
                onDelete={() => handleDelete(r.id)}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center py-12 text-varnish">
              {filter === 'pending' ? 'אין ביקורות הממתינות לאישור' : 'אין ביקורות'}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// A date the browser's own picker understands, in local time rather than UTC,
// so a review written at 22:21 does not open as 19:21.
function toLocalInput(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ReviewRow({ review: r, shirts, editing, onEdit, onDone, onPatch, onApprove, onToggleProofs, onDelete }) {
  const shirt = shirts.find(s => s.id === r.shirt_id);

  // The draft is separate from the row, so half-typed words are not saved and
  // "ביטול" really does put everything back.
  const [draft, setDraft] = useState(null);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) { setDraft(null); setPicking(false); setError(''); return; }
    setDraft({
      rating: r.rating || 5,
      reviewer_name: r.reviewer_name || '',
      is_anonymous: !!r.is_anonymous,
      comment: r.comment || '',
      title: r.title || '',
      shirt_id: r.shirt_id || '',
      created_date: toLocalInput(r.created_date),
      verified_purchase: !!r.verified_purchase,
      image_url: r.image_url || '',
      image_hidden: !!r.image_hidden,
    });
  }, [editing, r.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (changes) => setDraft(d => ({ ...d, ...changes }));

  const save = async () => {
    setBusy(true);
    const ok = await onPatch({
      rating: Number(draft.rating) || 5,
      reviewer_name: draft.reviewer_name.trim(),
      is_anonymous: draft.is_anonymous,
      comment: draft.comment.trim(),
      title: draft.title.trim() || null,
      shirt_id: draft.shirt_id || null,
      created_date: draft.created_date ? new Date(draft.created_date).toISOString() : r.created_date,
      verified_purchase: draft.verified_purchase,
      image_url: draft.image_url || null,
      image_hidden: draft.image_hidden,
    });
    setBusy(false);
    if (ok) onDone();
  };

  const uploadPhoto = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setError('');
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file, bucket: 'review-images', folder: 'open' });
      set({ image_url: file_url, image_hidden: false });
    } catch (err) {
      setError(uploadErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const draftShirt = draft && shirts.find(s => s.id === draft.shirt_id);

  return (
    <div className={`border bg-white p-4 ${r.approved ? 'border-turf/30' : 'border-amber-500/40'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 font-bold ${r.approved ? 'bg-turf text-pitch' : 'bg-amber-500/20 text-amber-600'}`}>
              {r.approved ? 'מאושר' : 'ממתין לאישור'}
            </span>
            <span className="text-sm font-bold text-chalk">{r.is_anonymous ? 'אנונימי' : r.reviewer_name}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-turf text-turf' : 'text-varnish'}`} />)}
            </div>
            {r.verified_purchase && <span className="text-xs px-2 py-0.5 bg-turf/15 text-turf font-bold">רכישה מאומתת</span>}
            <span className="text-xs text-varnish font-mono mr-auto">{formatDate(r.created_date)}</span>
          </div>
          <p className="text-xs text-varnish mb-1">
            חולצה: {shirt ? <Link to={`/shirt/${shirt.id}`} className="text-turf hover:underline">{shirt.name}</Link> : (r.title || 'לא שויכה')}
          </p>
          <p className="text-sm text-varnish">{r.comment}</p>

          <div className="mt-2 flex items-end gap-3 flex-wrap">
            {r.image_url && (
              <a href={r.image_url} target="_blank" rel="noopener noreferrer" className="inline-block relative">
                <img src={r.image_url} alt="" className={`w-16 h-16 object-cover border border-brand-line hover:opacity-80 transition-opacity ${r.image_hidden ? 'opacity-30' : ''}`} />
                {r.image_hidden && <span className="absolute inset-0 flex items-center justify-center"><ImageOff className="w-5 h-5 text-redcard" /></span>}
              </a>
            )}
            {/* Any review can go in "לקוחות מספרים", not only the ones with a
                photo: a review without one shows the shirt it is about. */}
            <button onClick={onToggleProofs}
              title={r.approved ? '' : 'יוצג רק אחרי שהביקורת תאושר'}
              className={`text-xs px-3 py-1.5 font-bold transition-colors ${r.show_in_proofs ? 'bg-turf text-pitch' : 'border border-brand-line text-varnish hover:text-chalk'}`}>
              {r.show_in_proofs ? '✓ מוצג ב"לקוחות מספרים"' : 'להציג ב"לקוחות מספרים"'}
            </button>
          </div>
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onEdit} title="ערוך"
            className={`flex items-center gap-1 text-xs px-3 py-1.5 border transition-colors ${editing ? 'border-turf text-turf' : 'border-brand-line text-varnish hover:text-chalk'}`}>
            <Pencil className="w-3 h-3" /> ערוך
          </button>
          {!r.approved ? (
            <button onClick={() => onApprove(true)}
              className="flex items-center gap-1 text-xs bg-turf text-pitch px-3 py-1.5 font-bold hover:opacity-90">
              <Check className="w-3 h-3" /> אשר
            </button>
          ) : (
            <button onClick={() => onApprove(false)}
              className="rounded-xl flex items-center gap-1 text-xs text-varnish hover:text-chalk px-3 py-1.5 border border-brand-line">
              <X className="w-3 h-3" /> הסתר
            </button>
          )}
          <button onClick={onDelete} className="flex items-center gap-1 text-xs text-varnish hover:text-redcard px-2 py-1.5">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {editing && draft && (
        <div className="mt-4 pt-4 border-t border-brand-line space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="דירוג">
              <div className="flex gap-1 py-1.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} type="button" onClick={() => set({ rating: s })} aria-label={`${s} כוכבים`}>
                    <Star className={`w-6 h-6 transition-colors ${s <= draft.rating ? 'fill-turf text-turf' : 'text-varnish hover:text-amber-600/50'}`} />
                  </button>
                ))}
              </div>
            </Field>

            <Field label="תאריך">
              <input type="datetime-local" value={draft.created_date} onChange={e => set({ created_date: e.target.value })}
                className="rounded-xl w-full bg-white border border-brand-line px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" />
            </Field>

            <Field label="שם המבקר">
              <input value={draft.reviewer_name} onChange={e => set({ reviewer_name: e.target.value })} maxLength={60}
                className="rounded-xl w-full bg-white border border-brand-line px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" />
              <Toggle checked={draft.is_anonymous} onChange={v => set({ is_anonymous: v })} label="להציג כאנונימי" />
            </Field>

            <Field label="מה הזמין (טקסט חופשי, כשאין חולצה משויכת)">
              <input value={draft.title} onChange={e => set({ title: e.target.value })} maxLength={120}
                placeholder="למשל: חולצת ריאל מדריד בית"
                className="rounded-xl w-full bg-white border border-brand-line px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" />
            </Field>
          </div>

          <Field label="הטקסט שהוא כתב">
            <textarea value={draft.comment} onChange={e => set({ comment: e.target.value })} rows={3} maxLength={1000}
              className="rounded-xl w-full bg-white border border-brand-line px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none resize-y" />
          </Field>

          <Field label="החולצה שהביקורת עליה">
            <div className="flex items-center gap-2 flex-wrap">
              {draftShirt ? (
                <span className="rounded-xl inline-flex items-center gap-1.5 bg-white border border-brand-line pl-1.5 pr-1 py-1">
                  {draftShirt.main_image && <img src={draftShirt.main_image} alt="" className="w-6 h-6 object-cover" />}
                  <span className="text-xs text-chalk max-w-[200px] truncate">{draftShirt.name}</span>
                  <button type="button" onClick={() => set({ shirt_id: '' })} aria-label="הסר חולצה" className="text-brand-navy/50 hover:text-redcard transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ) : (
                <span className="text-xs text-varnish">{draft.shirt_id ? 'חולצה שאינה בקטלוג' : 'לא שויכה חולצה'}</span>
              )}
              <button type="button" onClick={() => setPicking(!picking)}
                className="rounded-xl text-xs px-2.5 py-1.5 border border-brand-line text-brand-navy/70 hover:border-turf hover:text-turf transition-colors">
                {draftShirt ? 'החלף חולצה' : 'שייך חולצה'}
              </button>
              <Toggle checked={draft.verified_purchase} onChange={v => set({ verified_purchase: v })} label="רכישה מאומתת" />
            </div>
            {picking && <ShirtPicker shirts={shirts} onPick={s => { set({ shirt_id: s.id }); setPicking(false); }} />}
          </Field>

          <Field label="תמונה">
            <div className="flex items-center gap-3 flex-wrap">
              {draft.image_url ? (
                <>
                  <img src={draft.image_url} alt="" className={`w-20 h-20 object-cover border border-brand-line ${draft.image_hidden ? 'opacity-30' : ''}`} />
                  <button type="button" onClick={() => set({ image_hidden: !draft.image_hidden })}
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 font-bold transition-colors ${draft.image_hidden ? 'border border-brand-line text-varnish hover:text-chalk' : 'bg-turf text-pitch'}`}>
                    {draft.image_hidden ? <><ImageOff className="w-3 h-3" /> מוסתרת</> : <><ImageIcon className="w-3 h-3" /> מוצגת</>}
                  </button>
                  <button type="button" onClick={() => set({ image_url: '', image_hidden: false })}
                    className="text-xs text-varnish hover:text-redcard transition-colors">מחק תמונה</button>
                </>
              ) : (
                <span className="text-xs text-varnish">אין תמונה</span>
              )}
              <label className="rounded-xl text-xs px-2.5 py-1.5 border border-brand-line text-brand-navy/70 hover:border-turf hover:text-turf cursor-pointer transition-colors">
                {draft.image_url ? 'החלף תמונה' : 'העלה תמונה'}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { uploadPhoto(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
            </div>
            <p className="text-[11px] text-varnish mt-1">
              "מוסתרת" משאירה את התמונה שמורה ומורידה אותה מהאתר. "מחק תמונה" מנתק אותה לצמיתות.
            </p>
          </Field>

          {error && <p className="text-redcard text-sm">{error}</p>}

          <div className="flex gap-2">
            <button onClick={save} disabled={busy}
              className="text-xs bg-turf text-pitch px-4 py-2 font-bold hover:opacity-90 disabled:opacity-50">
              {busy ? 'שומר…' : 'שמור שינויים'}
            </button>
            <button onClick={onDone} disabled={busy}
              className="rounded-xl text-xs border border-brand-line text-varnish hover:text-chalk px-4 py-2 transition-colors">
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <span className="block text-xs text-varnish mb-1">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-1.5 mt-1.5 text-xs text-varnish cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="accent-turf w-3.5 h-3.5" />
      {label}
    </label>
  );
}
