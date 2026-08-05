import React, { useState, useEffect } from 'react';
import { Star, Loader2, Check, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { friendlyError } from '@/lib/errorMessages';
import EmptyState from '@/components/ui/EmptyState';

function StarRating({ rating, onSelect, interactive = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type={interactive ? 'button' : undefined}
          onClick={() => interactive && onSelect && onSelect(s)}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star className={`w-5 h-5 ${(hovered || rating) >= s ? 'fill-[#E8622A] text-[#E8622A]' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

export default function ShirtReviews({ shirtId, user }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [form, setForm] = useState({ rating: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, [shirtId, user]);

  async function loadData() {
    setLoading(true);
    const all = await base44.entities.Review.filter({ approved: true }, '-created_date', 20);
    setReviews(all);

    // Check if this user has a closed InterestRequest for this shirt
    if (user) {
      const closed = await base44.entities.InterestRequest.filter({
        user_id: user.id,
        shirt_id: shirtId,
        status: 'closed',
      });
      setCanReview(closed.length > 0);
    }
    setLoading(false);
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.rating) errs.rating = 'בחר דירוג';
    if (!form.comment.trim()) errs.comment = 'שדה חובה';
    if (form.comment.length > 1000) errs.comment = 'הביקורת ארוכה מדי (מקסימום 1000 תווים)';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setErrors({});
    try {
      await base44.entities.Review.create({
        reviewer_name: user.full_name,
        rating: form.rating,
        comment: form.comment,
        approved: false,
        user_id: user.id,
        shirt_id: shirtId,
      });
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: friendlyError(err, 'שליחת הביקורת נכשלה. נסה שוב בעוד רגע.') });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="mt-12 border-t-2 border-[#1B2A4A] pt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-black text-xl text-[#1B2A4A] uppercase">ביקורות לקוחות</h2>
        {avgRating && (
          <div className="flex items-center gap-2 bg-[#1B2A4A] text-white px-3 py-1.5">
            <span className="font-mono font-bold text-lg text-[#E8622A]">{avgRating}</span>
            <StarRating rating={Math.round(avgRating)} />
            <span className="text-xs text-gray-300">({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <EmptyState
          compact
          icon={Star}
          title="אין ביקורות עדיין"
          description="הביקורות הראשונות יופיעו כאן לאחר אישור."
          className="mb-6"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white p-4" style={{ border: '2px solid #1B2A4A' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-bold text-sm text-[#1B2A4A] uppercase">{r.reviewer_name}</span>
                <StarRating rating={r.rating} />
              </div>
              <p className="text-sm text-gray-600 font-body leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      )}

      {/* Write review — only for verified buyers */}
      {!user ? (
        <div className="bg-[#F2ECD9] p-4 flex items-center gap-3" style={{ border: '2px solid #1B2A4A' }}>
          <Lock className="w-4 h-4 text-[#1B2A4A] flex-shrink-0" />
          <p className="text-sm font-body text-gray-600">יש להתחבר כדי לכתוב ביקורת</p>
        </div>
      ) : !canReview ? (
        <div className="bg-[#F2ECD9] p-4 flex items-center gap-3" style={{ border: '2px solid #1B2A4A' }}>
          <Lock className="w-4 h-4 text-[#1B2A4A] flex-shrink-0" />
          <p className="text-sm font-body text-gray-600">רק לקוחות שרכשו את החולצה יכולים לכתוב ביקורת</p>
        </div>
      ) : submitted ? (
        <div className="bg-[#F2ECD9] p-4 flex items-center gap-3" style={{ border: '2px solid #1B2A4A' }}>
          <Check className="w-4 h-4 text-[#E8622A]" />
          <p className="text-sm font-body font-bold text-[#1B2A4A]">תודה! הביקורת תפורסם לאחר אישור.</p>
        </div>
      ) : (
        <div className="bg-[#F2ECD9] p-5" style={{ border: '2px solid #1B2A4A' }}>
          <h3 className="font-heading font-bold text-base text-[#1B2A4A] uppercase mb-4">כתוב ביקורת</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium font-body block mb-1">דירוג *</label>
              <StarRating rating={form.rating} interactive onSelect={r => { setForm(p => ({ ...p, rating: r })); setErrors(p => ({ ...p, rating: undefined })); }} />
              {errors.rating && <p className="text-red-500 text-xs mt-1">{errors.rating}</p>}
            </div>
            <div>
              <label className="text-sm font-medium font-body block mb-1">ביקורת *</label>
              <textarea value={form.comment} onChange={e => { setForm(p => ({ ...p, comment: e.target.value })); setErrors(p => ({ ...p, comment: undefined })); }} maxLength={1000}
                rows={3} className={`w-full border-2 px-3 py-2 text-sm bg-white focus:outline-none resize-none font-body ${errors.comment ? 'border-red-500' : 'border-[#1B2A4A]'}`} />
              {errors.comment && <p className="text-red-500 text-xs mt-1">{errors.comment}</p>}
            </div>
            <button type="submit" disabled={submitting}
              className="bg-[#E8622A] text-white px-5 py-2 font-heading font-bold text-sm uppercase hover:bg-[#D0551F] transition-colors disabled:opacity-50 flex items-center gap-2"
              style={{ boxShadow: '2px 2px 0 #1B2A4A' }}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'שולח...' : 'שלח ביקורת'}
            </button>
            {errors.submit && <p className="text-red-500 text-xs mt-2">{errors.submit}</p>}
          </form>
        </div>
      )}
    </div>
  );
}