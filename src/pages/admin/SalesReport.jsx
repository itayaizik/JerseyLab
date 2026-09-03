import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { parseDate } from '@/lib/dates';
import { TrendingUp, ShoppingBag, DollarSign, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// When a row was last touched. Nothing wrote `updated_date` until recently,
// so historical rows have none - and `new Date(null)` is the epoch, which sits
// before every cutoff and quietly dropped those sales from every period except
// "all time". Falling back to the creation date keeps them in the report; it is
// an approximation for anything created in one month and sold in another.
function activityDate(row) {
  return parseDate(row?.updated_date) || parseDate(row?.created_date);
}

const PERIOD_OPTIONS = [
  { label: '7 ימים', days: 7 },
  { label: '30 יום', days: 30 },
  { label: '90 יום', days: 90 },
  { label: 'הכל', days: 0 },
];

export default function SalesReport() {
  const [shirts, setShirts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    async function load() {
      const [allShirts, allRequests] = await Promise.all([
        base44.entities.Shirt.list('-created_date', 500),
        base44.entities.InterestRequest.list('-created_date', 500),
      ]);
      setShirts(allShirts);
      setRequests(allRequests);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" /></div>;
  }

  const now = new Date();
  const cutoff = period === 0 ? null : new Date(now.getTime() - period * 24 * 60 * 60 * 1000);

  // Sold shirts in period
  const soldShirts = shirts.filter(s => {
    if (s.status !== 'sold') return false;
    if (!cutoff) return true;
    const when = activityDate(s);
    return when ? when >= cutoff : false;
  });

  // Closed requests in period
  const closedRequests = requests.filter(r => {
    if (r.status !== 'closed') return false;
    if (!cutoff) return true;
    const when = activityDate(r);
    return when ? when >= cutoff : false;
  });

  // Revenue from sold shirts (match closed requests to sold shirts)
  const revenue = soldShirts.reduce((sum, s) => sum + (s.sale_price && s.sale_price < s.price ? s.sale_price : s.price || 0), 0);
  const avgPrice = soldShirts.length > 0 ? Math.round(revenue / soldShirts.length) : 0;

  // Reserved shirts
  const reservedShirts = shirts.filter(s => s.status === 'reserved');
  const potentialRevenue = reservedShirts.reduce((sum, s) => sum + (s.sale_price && s.sale_price < s.price ? s.sale_price : s.price || 0), 0);

  // Monthly breakdown - last 6 months
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = d.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' });

    const monthlySold = shirts.filter(s => {
      if (s.status !== 'sold') return false;
      const upd = activityDate(s);
      if (!upd) return false;
      return upd.getFullYear() === year && upd.getMonth() === month;
    });
    const monthlyRevenue = monthlySold.reduce((sum, s) => sum + (s.sale_price && s.sale_price < s.price ? s.sale_price : s.price || 0), 0);
    monthlyData.push({ label, count: monthlySold.length, revenue: monthlyRevenue });
  }

  // Top sold shirts
  const soldWithRevenue = soldShirts.map(s => ({
    ...s,
    effectivePrice: s.sale_price && s.sale_price < s.price ? s.sale_price : s.price || 0,
  })).sort((a, b) => b.effectivePrice - a.effectivePrice);

  // Interest by shirt - top requested
  const interestMap = {};
  requests.forEach(r => {
    if (!r.shirt_id) return;
    if (!interestMap[r.shirt_id]) interestMap[r.shirt_id] = { name: r.shirt_name || r.shirt_id, count: 0 };
    interestMap[r.shirt_id].count++;
  });
  const topInterest = Object.values(interestMap).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="font-heading font-black text-2xl text-turf flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          דוח מכירות
        </h1>
        {/* Period selector */}
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.days}
              onClick={() => setPeriod(opt.days)}
              className={`px-3 py-1.5 text-xs font-bold font-heading uppercase transition-colors border ${period === opt.days ? 'bg-turf text-pitch border-turf' : 'border-white/20 text-varnish hover:text-chalk'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="bg-white/5 border border-white/10 p-4">
          <p className="text-xs text-varnish mb-1 uppercase font-heading">סה"כ נמכר</p>
          <p className="font-mono font-bold text-3xl text-turf">₪{revenue.toLocaleString()}</p>
          <p className="text-xs text-varnish mt-1">{soldShirts.length} חולצות</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4">
          <p className="text-xs text-varnish mb-1 uppercase font-heading">מחיר ממוצע</p>
          <p className="font-mono font-bold text-3xl text-chalk">₪{avgPrice.toLocaleString()}</p>
          <p className="text-xs text-varnish mt-1">לחולצה</p>
        </div>
        <div className="bg-white/5 border border-amber-500/30 p-4">
          <p className="text-xs text-varnish mb-1 uppercase font-heading">הכנסה פוטנציאלית</p>
          <p className="font-mono font-bold text-3xl text-amber-400">₪{potentialRevenue.toLocaleString()}</p>
          <p className="text-xs text-varnish mt-1">{reservedShirts.length} שמורות</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4">
          <p className="text-xs text-varnish mb-1 uppercase font-heading">בקשות סגורות</p>
          <p className="font-mono font-bold text-3xl text-chalk">{closedRequests.length}</p>
          <p className="text-xs text-varnish mt-1">בתקופה זו</p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-white/5 border border-white/10 p-4 mb-6">
        <h2 className="font-heading font-bold text-sm text-turf mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4" />
          הכנסות לפי חודש (6 חודשים אחרונים)
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: '#8E8E8E', fontSize: 11 }} />
            <YAxis tick={{ fill: '#8E8E8E', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#0C0D0E', border: '1px solid rgba(255,255,255,0.1)', color: '#F9FAF7', fontSize: 12 }}
              formatter={(val) => [`₪${val.toLocaleString()}`, 'הכנסה']}
            />
            <Bar dataKey="revenue" fill="#E8622A" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sold Shirts List */}
        <div className="bg-white/5 border border-white/10 p-4">
          <h2 className="font-heading font-bold text-sm text-turf mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            חולצות שנמכרו ({soldShirts.length})
          </h2>
          {soldWithRevenue.length === 0 ? (
            <p className="text-sm text-varnish text-center py-6">אין מכירות בתקופה זו</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {soldWithRevenue.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-varnish font-mono w-5 flex-shrink-0">{i + 1}.</span>
                    <div className="min-w-0">
                      <p className="text-sm truncate">{s.name}</p>
                      <p className="text-xs text-varnish">{s.club || s.national_team || ''}</p>
                    </div>
                  </div>
                  <span className="font-mono text-turf font-bold text-sm flex-shrink-0 mr-2">₪{s.effectivePrice.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Interest */}
        <div className="bg-white/5 border border-white/10 p-4">
          <h2 className="font-heading font-bold text-sm text-turf mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            הכי מבוקשות (בקשות התעניינות)
          </h2>
          {topInterest.length === 0 ? (
            <p className="text-sm text-varnish text-center py-6">אין נתוני בקשות</p>
          ) : (
            <div className="space-y-3">
              {topInterest.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-xs text-varnish font-mono w-5 flex-shrink-0">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm truncate">{item.name}</p>
                      <span className="text-xs text-varnish font-mono mr-2">{item.count} בקשות</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-turf rounded-full"
                        style={{ width: `${Math.round((item.count / topInterest[0].count) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}