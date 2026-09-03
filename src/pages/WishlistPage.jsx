import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ShirtCard from '@/components/ShirtCard';
import ShirtCardSkeleton from '@/components/ui/ShirtCardSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/use-toast';

export default function WishlistPage() {
  const [shirts, setShirts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const wl = await base44.entities.Wishlist.filter({ user_id: me.id });
        setWishlistIds(wl.map(w => w.shirt_id));
        if (wl.length) {
          const shirtPromises = wl.map(w => base44.entities.Shirt.get(w.shirt_id));
          const results = await Promise.all(shirtPromises);
          setShirts(results.filter(Boolean));
        }
      } catch (err) {
        if (!navigator.onLine) { setError(true); }
        else { navigate('/login'); }
      }
      setLoading(false);
    }
    load();
  }, []);

  const clearAll = async () => {
    if (!window.confirm(`להסיר את כל ${shirts.length} החולצות מהמועדפים?`)) return;
    const items = await base44.entities.Wishlist.filter({ user_id: user.id });
    await Promise.all(items.map(i => base44.entities.Wishlist.delete(i.id).catch(() => {})));
    setWishlistIds([]);
    setShirts([]);
    toast({ title: 'המועדפים נוקו' });
  };

  const toggleWishlist = async (shirtId) => {
    const items = await base44.entities.Wishlist.filter({ user_id: user.id, shirt_id: shirtId });
    if (items[0]) await base44.entities.Wishlist.delete(items[0].id);
    setWishlistIds(p => p.filter(id => id !== shirtId));
    setShirts(p => p.filter(s => s.id !== shirtId));
    toast({ title: 'הוסר ממועדפים' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Same sticker header the other standalone pages use, so the wishlist
          stops looking like a bare grid dropped onto the page. */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6 pb-5 border-b-2 border-[#1B2A4A]/15">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex-shrink-0 bg-[#1B2A4A] flex items-center justify-center"
            style={{ boxShadow: '3px 3px 0 #E8622A' }}>
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h1 className="font-heading font-black text-2xl md:text-3xl text-[#1B2A4A] uppercase leading-none"
              style={{ textShadow: '2px 2px 6px rgba(27,42,74,0.15)' }}>
              המועדפים שלי
            </h1>
            <p className="text-sm text-[#1B2A4A]/50 mt-1.5 font-body">
              {loading ? 'טוען…' : shirts.length > 0 ? `${shirts.length} חולצות שמורות` : 'עדיין ריק'}
            </p>
          </div>
        </div>

        {!loading && !error && shirts.length > 0 && (
          <div className="flex items-center gap-2">
            <Link to="/catalog"
              className="px-3 py-2 text-xs font-heading font-bold uppercase tracking-wide text-[#1B2A4A] bg-white border-2 border-[#1B2A4A] hover:bg-[#F2ECD9] transition-colors"
              style={{ boxShadow: '2px 2px 0 #1B2A4A' }}>
              המשך לחפש
            </Link>
            <button onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-heading font-bold uppercase tracking-wide text-[#1B2A4A]/60 hover:text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              נקה הכל
            </button>
          </div>
        )}
      </div>

      {/* Nothing is bought on the site, so say what the heart actually does. */}
      {!loading && !error && shirts.length > 0 && (
        <p className="mb-5 text-xs text-[#1B2A4A]/55 font-body bg-[#FFD95A]/25 border-r-2 border-[#FFD95A] px-3 py-2">
          המועדפים נשמרים לחשבון שלך בלבד. כדי להזמין, היכנס לחולצה ושלח בקשה - ואנחנו נחזור אליך.
        </p>
      )}
      {error ? (
        <div className="text-center py-20 border-2 border-dashed border-[#1B2A4A]/20">
          <p className="font-heading font-bold text-xl text-[#1B2A4A]/40 mb-2 uppercase">לא הצלחנו לטעון את המועדפים</p>
          <p className="text-sm text-[#1B2A4A]/30 font-body mb-4">בדוק את החיבור לאינטרנט ונסה שוב</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#E8622A] text-white text-sm font-bold font-heading uppercase hover:bg-[#D0551F] transition-colors">
            נסה שוב
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <ShirtCardSkeleton key={i} />)}
        </div>
      ) : shirts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {shirts.map(s => (
            <ShirtCard key={s.id} shirt={s} user={user} isWishlisted={true} onToggleWishlist={toggleWishlist} />
          ))}
        </div>
      ) : (
        <EmptyState
          bordered
          icon={Heart}
          title="אין חולצות במועדפים"
          description="לחץ על הלב בחולצה שאהבת והיא תישמר כאן - תוכל לחזור אליה מתי שתרצה."
          actionLabel="גלה חולצות"
          actionTo="/catalog"
        />
      )}
    </div>
  );
}