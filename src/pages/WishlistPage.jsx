import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
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

  const toggleWishlist = async (shirtId) => {
    const items = await base44.entities.Wishlist.filter({ user_id: user.id, shirt_id: shirtId });
    if (items[0]) await base44.entities.Wishlist.delete(items[0].id);
    setWishlistIds(p => p.filter(id => id !== shirtId));
    setShirts(p => p.filter(s => s.id !== shirtId));
    toast({ title: 'הוסר ממועדפים' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-heading font-black text-2xl flex items-center gap-2" style={{ textShadow: '2px 2px 6px rgba(27,42,74,0.15)' }}>
          <Heart className="w-6 h-6 text-redcard fill-redcard" />
          המועדפים שלי
        </h1>
        {!loading && !error && shirts.length > 0 && (
          <p className="text-sm text-[#1B2A4A]/50 mt-1 font-body">{shirts.length} חולצות שמורות</p>
        )}
      </div>
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
          description="לחץ על הלב בחולצה שאהבת והיא תישמר כאן — תוכל לחזור אליה מתי שתרצה."
          actionLabel="גלה חולצות"
          actionTo="/catalog"
        />
      )}
    </div>
  );
}