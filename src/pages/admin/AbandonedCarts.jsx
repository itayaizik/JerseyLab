import React, { useState, useEffect } from 'react';
import { ShoppingCart, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDateTime, dateSortValue } from '@/lib/dates';

// Where the shop loses people on the way to an order.
//
// The orders page says what arrived. This says what nearly did: a basket that
// was filled and left, and - the more expensive one - a basket that reached the
// details form and still did not turn into an order.
//
// There is no name, phone or email on this page, because none is collected.
// Each row is a basket, not a person, so this cannot be used to chase anyone;
// it is here to show which shirts get abandoned and which field the form loses
// people at, which are the two things worth fixing.

// The form's field names, as they read in Hebrew.
const FIELD_LABELS = {
  full_name: 'שם מלא',
  phone: 'טלפון',
  email: 'אימייל',
  contact_channel: 'דרך יצירת קשר',
  instagram_handle: 'שם משתמש באינסטגרם',
};

const PERIODS = [7, 30, 90];

export default function AbandonedCarts() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(30);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data, error: err } = await supabase
      .from('cart_sessions_raw')
      .select('*')
      .order('updated_date', { ascending: false })
      .limit(1000);
    if (err) setError(err.message);
    setRows(data || []);
    setLoading(false);
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - period);
  const filtered = rows.filter(r => dateSortValue(r.updated_date) >= cutoff.getTime());

  // A basket that is still being filled right now is not abandoned yet. An hour
  // is long enough that nobody is still shopping, and short enough that today's
  // numbers are today's.
  const SETTLE_MS = 60 * 60 * 1000;
  const settled = filtered.filter(r => Date.now() - dateSortValue(r.updated_date) > SETTLE_MS);

  const ordered = settled.filter(r => r.ordered);
  const abandoned = settled.filter(r => !r.ordered);
  const abandonedAtCheckout = abandoned.filter(r => r.reached_checkout);

  const conversion = settled.length
    ? Math.round((ordered.length / settled.length) * 100)
    : null;

  const lostValue = abandoned.reduce((sum, r) => sum + Number(r.value || 0), 0);

  // Which field the form stops at, counted only for baskets that reached it and
  // never came back - the ones that finished are not a problem to solve.
  const stopCounts = {};
  abandonedAtCheckout.forEach(r => {
    if (!r.stopped_at) return;
    stopCounts[r.stopped_at] = (stopCounts[r.stopped_at] || 0) + 1;
  });
  const stopTop = Object.entries(stopCounts).sort(([, a], [, b]) => b - a);

  // Which shirts sit in abandoned baskets.
  const shirtCounts = {};
  abandoned.forEach(r => {
    let items = [];
    try { items = JSON.parse(r.items || '[]'); } catch { /* an older or broken row */ }
    items.forEach(line => {
      const name = String(line).split(' · ')[0];
      if (name) shirtCounts[name] = (shirtCounts[name] || 0) + 1;
    });
  });
  const shirtTop = Object.entries(shirtCounts).sort(([, a], [, b]) => b - a).slice(0, 15);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="font-heading font-black text-2xl text-turf">סלים שננטשו</h1>
        <div className="flex gap-2">
          {PERIODS.map(d => (
            <button key={d} onClick={() => setPeriod(d)}
              className={`text-xs px-3 py-1.5 font-bold font-heading uppercase transition-colors ${period === d ? 'bg-turf text-pitch' : 'border border-brand-line text-varnish hover:text-chalk'}`}>
              {d} ימים
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-varnish mb-6">
        בלי שמות, טלפונים או אימיילים - כל שורה היא סל, לא אדם.
      </p>

      {error && (
        <div className="rounded-2xl border border-redcard/30 bg-redcard/5 p-4 mb-6 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-redcard mt-0.5 shrink-0" />
          <p className="text-sm text-redcard">לא הצלחנו לטעון את הנתונים: {error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl bg-white border border-brand-line p-4">
          <p className="text-xs text-varnish font-heading uppercase mb-1">סלים שננטשו</p>
          <p className="font-mono font-bold text-2xl text-chalk">{abandoned.length}</p>
        </div>
        <div className="rounded-2xl bg-white border border-brand-line p-4">
          <p className="text-xs text-varnish font-heading uppercase mb-1">נטשו בטופס הפרטים</p>
          <p className="font-mono font-bold text-2xl text-redcard">{abandonedAtCheckout.length}</p>
        </div>
        <div className="rounded-2xl bg-white border border-brand-line p-4">
          <p className="text-xs text-varnish font-heading uppercase mb-1">הפכו להזמנה</p>
          <p className="font-mono font-bold text-2xl text-turf">{conversion == null ? '-' : `${conversion}%`}</p>
        </div>
        <div className="rounded-2xl bg-white border border-brand-line p-4">
          <p className="text-xs text-varnish font-heading uppercase mb-1">שווי שלא נסגר</p>
          <p className="font-mono font-bold text-2xl text-chalk">₪{Math.round(lostValue).toLocaleString('he-IL')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Where the form loses people. */}
        <div className="rounded-2xl bg-white border border-brand-line p-5">
          <h2 className="font-heading font-bold text-sm text-chalk uppercase mb-1 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-redcard" /> איפה הטופס מאבד אנשים
          </h2>
          <p className="text-xs text-varnish mb-4">השדה האחרון שנגעו בו לפני שעזבו - רק שם השדה, לא מה שנכתב בו.</p>
          {stopTop.length === 0 ? (
            <p className="text-varnish text-sm">אף אחד לא נטש את הטופס בתקופה זו.</p>
          ) : (
            <div className="space-y-2">
              {stopTop.map(([field, count]) => (
                <div key={field} className="flex items-center gap-3">
                  <span className="text-sm text-chalk flex-1">{FIELD_LABELS[field] || field}</span>
                  <div className="h-2 rounded-full bg-brand-mist flex-1 overflow-hidden">
                    <div className="h-full rounded-full bg-redcard"
                      style={{ width: `${Math.round((count / stopTop[0][1]) * 100)}%` }} />
                  </div>
                  <span className="font-mono text-sm text-varnish w-8 text-left">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* What is in the baskets nobody finished. */}
        <div className="rounded-2xl bg-white border border-brand-line p-5">
          <h2 className="font-heading font-bold text-sm text-chalk uppercase mb-1 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-turf" /> החולצות שננטשות הכי הרבה
          </h2>
          <p className="text-xs text-varnish mb-4">חולצה שחוזרת פה הרבה - שווה לבדוק מחיר, מלאי או תמונות.</p>
          {shirtTop.length === 0 ? (
            <p className="text-varnish text-sm">אין סלים שננטשו בתקופה זו.</p>
          ) : (
            <div className="space-y-2">
              {shirtTop.map(([name, count]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-sm text-chalk flex-1 truncate" title={name}>{name}</span>
                  <span className="font-mono text-sm text-varnish">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* The rows themselves, newest first. */}
      <div className="rounded-2xl bg-white border border-brand-line p-5 mt-6">
        <h2 className="font-heading font-bold text-sm text-chalk uppercase mb-4">הסלים האחרונים</h2>
        {filtered.length === 0 ? (
          <p className="text-varnish text-sm">אין נתונים בתקופה זו.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-xs font-heading uppercase text-varnish border-b border-brand-line">
                  <th className="py-2 pl-3 font-bold">מתי</th>
                  <th className="py-2 pl-3 font-bold">בסל</th>
                  <th className="py-2 pl-3 font-bold">שווי</th>
                  <th className="py-2 pl-3 font-bold">הגיע לפרטים</th>
                  <th className="py-2 font-bold">מה קרה</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map(r => {
                  let items = [];
                  try { items = JSON.parse(r.items || '[]'); } catch { /* an older or broken row */ }
                  return (
                    <tr key={r.id} className="border-b border-brand-line/50 align-top">
                      <td className="py-2 pl-3 text-varnish whitespace-nowrap">{formatDateTime(r.updated_date)}</td>
                      <td className="py-2 pl-3 text-chalk">
                        {items.length === 0 ? '-' : items.join(', ')}
                      </td>
                      <td className="py-2 pl-3 font-mono text-chalk whitespace-nowrap">₪{Math.round(Number(r.value || 0))}</td>
                      <td className="py-2 pl-3 text-varnish">{r.reached_checkout ? 'כן' : 'לא'}</td>
                      <td className="py-2 whitespace-nowrap">
                        {r.ordered ? (
                          <span className="inline-flex items-center gap-1 text-turf font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> הזמין
                          </span>
                        ) : r.stopped_at ? (
                          <span className="text-redcard">עצר ב{FIELD_LABELS[r.stopped_at] || r.stopped_at}</span>
                        ) : (
                          <span className="text-varnish">נטש את הסל</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
