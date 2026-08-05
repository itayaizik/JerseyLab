import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, MessageCircle, LogOut, Package } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const [reqs, wl] = await Promise.all([
          base44.entities.InterestRequest.filter({ user_id: me.id }, '-created_date', 20),
          base44.entities.Wishlist.filter({ user_id: me.id }),
        ]);
        setRequests(reqs);
        setWishlistCount(wl.length);
      } catch (err) {
        if (!navigator.onLine) { setError(true); }
        else { navigate('/login'); }
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout('/');
  };

  const statusLabels = { new: 'חדשה', contacted: 'נוצר קשר', closed: 'סגורה' };
  const statusColors = { new: 'bg-[#E8622A]', contacted: 'bg-[#1B2A4A]', closed: 'bg-gray-300' };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <p className="font-heading font-bold text-xl text-[#1B2A4A] mb-2 uppercase">לא הצלחנו לטעון את הפרופיל</p>
          <p className="text-sm text-[#1B2A4A]/50 font-body mb-4">בדוק את החיבור לאינטרנט ונסה שוב</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#E8622A] text-white text-sm font-bold font-heading uppercase hover:bg-[#D0551F] transition-colors">נסה שוב</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-varnish border-t-turf rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-varnish text-sm">טוען...</p>
        </div>
      </div>
    );
  }

  const newRequests = requests.filter(r => r.status === 'new').length;

  return (
    <div className="bg-[#F2ECD9] min-h-screen">
      {/* Hero */}
      <section style={{ background: '#E8DFC8' }} className="border-b-2 border-[#1B2A4A]">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-turf to-pitch flex items-center justify-center font-heading font-black text-2xl text-chalk border-2 border-[#1B2A4A]">
                {user?.full_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h1 className="font-heading font-black text-2xl text-[#1B2A4A]">{user?.full_name || 'משתמש'}</h1>
                <p className="text-sm text-varnish font-body">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#1B2A4A] text-[#1B2A4A] font-heading font-bold text-sm hover:bg-[#F2ECD9] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
              style={{ boxShadow: '2px 2px 0 #1B2A4A' }}
            >
              <LogOut className="w-4 h-4" />
              התנתקות
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/wishlist" 
            className="bg-white border-2 border-[#1B2A4A] p-5 hover:border-turf hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
            style={{ boxShadow: '3px 3px 0 #1B2A4A' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-varnish text-xs font-heading uppercase tracking-wide mb-2">מועדפים</p>
                <p className="font-heading font-black text-3xl text-turf">{wishlistCount}</p>
              </div>
              <Heart className="w-6 h-6 text-redcard group-hover:scale-110 transition-transform" />
            </div>
          </Link>

          <Link 
            to="#requests" 
            onClick={() => setActiveTab('requests')}
            className="bg-white border-2 border-[#1B2A4A] p-5 hover:border-turf hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
            style={{ boxShadow: '3px 3px 0 #1B2A4A' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-varnish text-xs font-heading uppercase tracking-wide mb-2">בקשות התעניינות</p>
                <p className="font-heading font-black text-3xl text-[#1B2A4A]">{requests.length}</p>
              </div>
              <MessageCircle className="w-6 h-6 text-[#1B2A4A] group-hover:scale-110 transition-transform" />
            </div>
            {newRequests > 0 && (
              <div className="mt-3 inline-block bg-[#E8622A] text-white text-xs px-2 py-1 font-bold rounded-full">
                {newRequests} חדשה
              </div>
            )}
          </Link>

          <Link 
            to="/catalog" 
            className="bg-white border-2 border-[#1B2A4A] p-5 hover:border-turf hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
            style={{ boxShadow: '3px 3px 0 #1B2A4A' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-varnish text-xs font-heading uppercase tracking-wide mb-2">מחפש עוד?</p>
                <p className="font-heading font-bold text-sm text-[#1B2A4A]">גלה חולצות</p>
              </div>
              <Package className="w-6 h-6 text-turf group-hover:scale-110 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Requests Section */}
      <div className="max-w-5xl mx-auto px-6 pb-12" id="requests">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-black text-2xl text-[#1B2A4A] uppercase tracking-wide">הבקשות שלי</h2>
          {requests.length > 0 && (
            <span className="text-xs font-heading text-varnish uppercase">סה"כ {requests.length}</span>
          )}
        </div>

        {requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map(r => (
              <div 
                key={r.id} 
                className="bg-white border-2 border-[#1B2A4A] overflow-hidden hover:border-turf hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group"
                style={{ boxShadow: '3px 3px 0 #1B2A4A' }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <Link 
                        to={`/shirt/${r.shirt_id}`} 
                        className="font-heading font-black text-base text-[#1B2A4A] hover:text-turf transition-colors uppercase line-clamp-2"
                      >
                        {r.shirt_name || 'חולצה'}
                      </Link>
                    </div>
                    <span className={`${statusColors[r.status] || 'bg-gray-200'} text-white text-xs px-3 py-1.5 font-heading font-bold uppercase tracking-wide flex-shrink-0 rounded`}>
                      {statusLabels[r.status] || r.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 pb-3 border-b border-gray-200">
                    {r.wanted_size && (
                      <div>
                        <p className="text-varnish text-xs uppercase font-heading mb-0.5">מידה</p>
                        <p className="font-mono font-bold text-sm text-[#1B2A4A]">{r.wanted_size}</p>
                      </div>
                    )}
                    {r.phone && (
                      <div>
                        <p className="text-varnish text-xs uppercase font-heading mb-0.5">טלפון</p>
                        <p className="font-mono font-bold text-sm text-[#1B2A4A]" dir="ltr">{r.phone}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-varnish text-xs uppercase font-heading mb-0.5">תאריך</p>
                      <p className="font-body text-sm text-[#1B2A4A]">{new Date(r.created_date).toLocaleDateString('he-IL')}</p>
                    </div>
                    {r.whatsapp && (
                      <div>
                        <p className="text-varnish text-xs uppercase font-heading mb-0.5">WhatsApp</p>
                        <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-turf hover:underline text-sm font-bold">
                          ✓
                        </a>
                      </div>
                    )}
                  </div>

                  {r.message && (
                    <div className="bg-[#F2ECD9] border border-[#1B2A4A]/20 p-3 mb-2">
                      <p className="text-varnish text-xs uppercase font-heading mb-1">הערה</p>
                      <p className="text-sm text-[#1B2A4A] font-body">{r.message}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-[#1B2A4A]/30 rounded-lg p-12 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-[#1B2A4A]/20" />
            <p className="text-varnish text-sm mb-4 font-body">עדיין לא שלחת בקשות התעניינות</p>
            <Link 
              to="/catalog" 
              className="inline-flex items-center gap-2 bg-[#E8622A] text-white px-6 py-3 font-heading font-bold text-sm uppercase hover:bg-[#D0551F] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
              style={{ boxShadow: '2px 2px 0 #1B2A4A', textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}
            >
              <Package className="w-4 h-4" />
              לקטלוג
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}