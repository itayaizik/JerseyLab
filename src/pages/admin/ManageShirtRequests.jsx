import React, { useState, useEffect } from 'react';
import { Search, Trash2, ExternalLink, MessageCircle, Instagram } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/dates';

// Requests for shirts the catalogue does not carry, sent from /request-shirt.
// Each one is a question waiting on an answer, so the list is built around
// getting from "new" to "answered": the photo is big enough to identify the
// kit at a glance, and the contact links open straight into the channel the
// customer asked to be reached on.

const STATUSES = {
  new: { label: 'חדשה', className: 'bg-[#E8622A] text-white' },
  answered: { label: 'נענתה', className: 'bg-[#FFD95A] text-[#1B2A4A]' },
  closed: { label: 'סגורה', className: 'bg-gray-200 text-[#1B2A4A]' },
};

export default function ManageShirtRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState('');

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    const query = filter === 'all' ? {} : { status: filter };
    const data = await base44.entities.ShirtRequest.filter(query, '-created_date', 100);
    setRequests(data);
    setLoading(false);
  }

  // Optimistic: the row is updated locally so the list does not jump while the
  // write is in flight, then reloaded so a failed write cannot leave the screen
  // disagreeing with the database.
  const setStatus = async (id, status) => {
    setRequests(p => p.map(r => (r.id === id ? { ...r, status } : r)));
    await base44.entities.ShirtRequest.update(id, { status });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('למחוק את הבקשה הזו? הפעולה בלתי הפיכה.')) return;
    await base44.entities.ShirtRequest.delete(id);
    setRequests(p => p.filter(r => r.id !== id));
  };

  const counts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-black text-2xl text-turf mb-1">בקשות לחולצות</h1>
        <p className="text-sm text-varnish font-body">
          חולצות שלקוחות חיפשו ולא מצאו בקטלוג
          {filter === 'all' && requests.length > 0 && ` — ${counts.new || 0} ממתינות לתשובה`}
        </p>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {[['all', 'הכל'], ['new', 'חדשות'], ['answered', 'נענו'], ['closed', 'סגורות']].map(([value, label]) => (
          <button key={value} onClick={() => setFilter(value)}
            className={`px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wide border-2 transition-colors ${
              filter === value ? 'bg-[#E8622A] text-white border-[#E8622A]' : 'border-white/20 text-white/70 hover:border-white/50'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-varnish text-sm font-body py-12 text-center border-2 border-dashed border-white/15">
          אין בקשות להצגה.
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map(r => {
            const status = STATUSES[r.status] || STATUSES.new;
            const waLink = r.phone ? `https://wa.me/${String(r.phone).replace(/\D/g, '').replace(/^0/, '972')}` : null;
            return (
              <div key={r.id} className="bg-white/5 border border-white/10 p-4">
                <div className="flex gap-4">
                  {/* Photo, when the customer sent one. Opens full size —
                      identifying a kit often needs the detail. */}
                  {r.image_url ? (
                    <button type="button" onClick={() => setLightbox(r.image_url)}
                      className="w-24 h-24 flex-shrink-0 border-2 border-white/20 overflow-hidden hover:border-[#E8622A] transition-colors">
                      <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <div className="w-24 h-24 flex-shrink-0 border-2 border-dashed border-white/15 flex items-center justify-center">
                      <Search className="w-6 h-6 text-white/20" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-white truncate">
                          {[r.club, r.season].filter(Boolean).join(' · ') || 'ללא קבוצה'}
                        </p>
                        <p className="text-xs text-varnish font-mono">
                          {formatDate(r.created_date)}
                          {r.wanted_size && ` · מידה ${r.wanted_size}`}
                        </p>
                      </div>
                      <span className={`${status.className} text-[11px] px-2 py-1 font-heading font-bold uppercase flex-shrink-0`}>
                        {status.label}
                      </span>
                    </div>

                    {r.shirt_description && (
                      <p className="text-sm text-white/80 font-body whitespace-pre-wrap mb-1.5">{r.shirt_description}</p>
                    )}
                    {r.notes && (
                      <p className="text-xs text-white/50 font-body whitespace-pre-wrap mb-2">הערות: {r.notes}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs text-white/70 font-body">{r.full_name}</span>
                      {waLink && (
                        <a href={waLink} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-400 hover:underline font-mono" dir="ltr">
                          <MessageCircle className="w-3 h-3" />{r.phone}
                        </a>
                      )}
                      {r.instagram_handle && (
                        <a href={`https://instagram.com/${r.instagram_handle}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-pink-400 hover:underline font-mono" dir="ltr">
                          <Instagram className="w-3 h-3" />@{r.instagram_handle}
                        </a>
                      )}
                      {r.email && (
                        <a href={`mailto:${r.email}`} className="text-xs text-blue-300 hover:underline font-mono" dir="ltr">
                          {r.email}
                        </a>
                      )}
                      {r.image_url && (
                        <a href={r.image_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70">
                          <ExternalLink className="w-3 h-3" />תמונה
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
                      {Object.entries(STATUSES).map(([value, meta]) => (
                        <button key={value} onClick={() => setStatus(r.id, value)}
                          disabled={r.status === value}
                          className={`px-2.5 py-1 text-[11px] font-heading font-bold uppercase border transition-colors ${
                            r.status === value
                              ? 'border-white/10 text-white/25 cursor-default'
                              : 'border-white/25 text-white/70 hover:border-[#E8622A] hover:text-[#E8622A]'
                          }`}>
                          {meta.label}
                        </button>
                      ))}
                      <button onClick={() => remove(r.id)} aria-label="מחק בקשה"
                        className="mr-auto text-white/30 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full-size photo. Click anywhere to dismiss. */}
      {lightbox && (
        <div onClick={() => setLightbox('')} role="presentation"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6 cursor-zoom-out">
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}
