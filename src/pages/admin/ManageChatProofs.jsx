import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Upload, Loader2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/dates';

// Screenshots of real conversations with customers, shown on the site as
// proof that people actually buy here and get answered.
//
// Everything about them is managed from this page - upload, caption, order,
// hide, delete - so the section can be filled and changed without touching
// code. Images go to the existing shirt-images bucket, which is already
// admin-write and public-read.

export default function ManageChatProofs() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await base44.entities.ChatProof.list('sort_order', 100);
    setProofs(data);
    setLoading(false);
  }

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
      setError('ההעלאה נכשלה. נסה שוב.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const toggleActive = async (proof) => {
    await base44.entities.ChatProof.update(proof.id, { active: !proof.active });
    setProofs(p => p.map(x => (x.id === proof.id ? { ...x, active: !x.active } : x)));
  };

  const saveCaption = async (proof, value) => {
    if (value === (proof.caption || '')) return;
    await base44.entities.ChatProof.update(proof.id, { caption: value });
    setProofs(p => p.map(x => (x.id === proof.id ? { ...x, caption: value } : x)));
  };

  // Swaps this row's position with its neighbour, then persists both.
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
      <div className="border-2 border-[#E8622A]/50 bg-[#E8622A]/10 p-4 mb-6">
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
          {proofs.map((proof, i) => (
            <div key={proof.id} className={`flex gap-4 border border-white/10 p-3 ${proof.active ? 'bg-white/5' : 'bg-white/[0.02] opacity-60'}`}>
              <a href={proof.image_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                <img src={proof.image_url} alt="" className="w-20 h-28 object-cover border border-white/20 hover:border-turf transition-colors" />
              </a>

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
          ))}
        </div>
      )}
    </div>
  );
}
