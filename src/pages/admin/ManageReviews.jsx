import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Check, X, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/dates';

export default function ManageReviews() {
  const [reviews, setReviews] = useState([]);
  const [shirts, setShirts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'approved' | 'all'

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

  const handleApprove = async (id, approved) => {
    await base44.entities.Review.update(id, { approved });
    setReviews(p => p.map(r => r.id === id ? { ...r, approved } : r));
  };

  // Any approved review can also be shown in "לקוחות מספרים" on the home
  // page, photo or not.
  const toggleProofs = async (review) => {
    const show_in_proofs = !review.show_in_proofs;
    try {
      await base44.entities.Review.update(review.id, { show_in_proofs });
      setReviews(p => p.map(r => r.id === review.id ? { ...r, show_in_proofs } : r));
    } catch {
      alert('לא נשמר. אם זו הפעם הראשונה, צריך קודם להריץ את קובץ ה-SQL (עמודה show_in_proofs).');
    }
  };

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
      setReviews(p => p.map(r => ids.has(r.id) ? { ...r, show_in_proofs: true } : r));
    } catch {
      alert('לא נשמר. אם זו הפעם הראשונה, צריך קודם להריץ את קובץ ה-SQL (עמודה show_in_proofs).');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('למחוק את הביקורת?')) return;
    await base44.entities.Review.delete(id);
    setReviews(p => p.filter(r => r.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" /></div>;

  const filtered = reviews.filter(r => {
    if (filter === 'pending') return !r.approved;
    if (filter === 'approved') return r.approved;
    return true;
  });

  const pendingCount = reviews.filter(r => !r.approved).length;
  const hiddenFromProofs = reviews.filter(r => r.approved && !r.show_in_proofs).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-black text-2xl text-turf">ניהול ביקורות</h1>
        <div className="flex gap-2 flex-wrap items-center">
          {hiddenFromProofs > 0 && (
            <button onClick={showAllApproved}
              className="text-xs px-3 py-1.5 font-bold font-heading border border-turf/50 text-turf hover:bg-turf hover:text-pitch transition-colors">
              הצג {hiddenFromProofs} ב"לקוחות מספרים"
            </button>
          )}
          {[
            { key: 'pending', label: `ממתין (${pendingCount})` },
            { key: 'approved', label: 'מאושר' },
            { key: 'all', label: 'הכל' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`text-xs px-3 py-1.5 font-bold font-heading uppercase transition-colors ${filter === f.key ? 'bg-turf text-pitch' : 'border border-white/20 text-varnish hover:text-chalk'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(r => {
          const shirt = shirts.find(s => s.id === r.shirt_id);
          return (
          <div key={r.id} className={`border bg-white/5 p-4 ${r.approved ? 'border-turf/30' : 'border-amber-500/40'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 font-bold ${r.approved ? 'bg-turf text-pitch' : 'bg-amber-500/20 text-amber-400'}`}>
                    {r.approved ? 'מאושר' : 'ממתין לאישור'}
                  </span>
                  <span className="text-sm font-bold text-chalk">{r.is_anonymous ? 'אנונימי' : r.reviewer_name}</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-varnish'}`} />)}
                  </div>
                  <span className="text-xs text-varnish font-mono mr-auto">{formatDate(r.created_date)}</span>
                </div>
                <p className="text-xs text-varnish mb-1">
                  חולצה: {shirt ? <Link to={`/shirt/${shirt.id}`} className="text-turf hover:underline">{shirt.name}</Link> : (r.shirt_id || 'לא ידוע')}
                </p>
                <p className="text-sm text-varnish">{r.comment}</p>
                {/* Any review can go in "לקוחות מספרים", not only the ones
                    with a photo: a review without one now shows the shirt it
                    is about instead, so there is nothing left to hide. */}
                <div className="mt-2 flex items-end gap-3">
                  {r.image_url && (
                    <a href={r.image_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                      <img src={r.image_url} alt="" className="w-16 h-16 object-cover border border-white/10 hover:opacity-80 transition-opacity" />
                    </a>
                  )}
                  <button onClick={() => toggleProofs(r)}
                    title={r.approved ? '' : 'יוצג רק אחרי שהביקורת תאושר'}
                    className={`text-xs px-3 py-1.5 font-bold transition-colors ${r.show_in_proofs ? 'bg-turf text-pitch' : 'border border-white/20 text-varnish hover:text-chalk'}`}>
                    {r.show_in_proofs ? '✓ מוצג ב"לקוחות מספרים"' : 'להציג ב"לקוחות מספרים"'}
                  </button>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!r.approved ? (
                  <button onClick={() => handleApprove(r.id, true)}
                    className="flex items-center gap-1 text-xs bg-turf text-pitch px-3 py-1.5 font-bold hover:opacity-90">
                    <Check className="w-3 h-3" /> אשר
                  </button>
                ) : (
                  <button onClick={() => handleApprove(r.id, false)}
                    className="flex items-center gap-1 text-xs text-varnish hover:text-chalk px-3 py-1.5 border border-white/10">
                    <X className="w-3 h-3" /> הסתר
                  </button>
                )}
                <button onClick={() => handleDelete(r.id)}
                  className="flex items-center gap-1 text-xs text-varnish hover:text-redcard px-2 py-1.5">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center py-12 text-varnish">
          {filter === 'pending' ? 'אין ביקורות הממתינות לאישור' : 'אין ביקורות'}
        </p>
      )}
    </div>
  );
}