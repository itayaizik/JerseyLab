import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Check, X, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-black text-2xl text-turf">ניהול ביקורות</h1>
        <div className="flex gap-2">
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
                  <span className="text-xs text-varnish font-mono mr-auto">{new Date(r.created_date).toLocaleDateString('he-IL')}</span>
                </div>
                <p className="text-xs text-varnish mb-1">
                  חולצה: {shirt ? <Link to={`/shirt/${shirt.id}`} className="text-turf hover:underline">{shirt.name}</Link> : (r.shirt_id || 'לא ידוע')}
                </p>
                <p className="text-sm text-varnish">{r.comment}</p>
                {r.image_url && (
                  <a href={r.image_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                    <img src={r.image_url} alt="" className="w-16 h-16 object-cover border border-white/10 hover:opacity-80 transition-opacity" />
                  </a>
                )}
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