import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, PackageCheck, Star, MessageCircle, Mail, Instagram, Copy, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/dates';
import { whatsappLink, orderKey } from '@/lib/orderItems';
import { inviteForOrder, reviewRequestText } from '@/lib/reviewInvites';
import {
  matchRequestsToShirts, shirtArrivedText,
  ordersAwaitingReview, REVIEW_WAIT_DAYS,
} from '@/lib/automations';

// The shop's to-do list, worked out from the data rather than from memory.
//
// Two things fall through the cracks in a shop run by one person: someone asks
// for a shirt, it turns up three weeks later and nobody remembers who asked;
// and an order arrives, the customer is happy, and nobody ever asks them to
// say so. Both are already answerable from what the site knows.
//
// Nothing here sends anything. Every row ends in a button that opens the
// message, written and ready, in whichever app that customer asked to be
// reached on - and then it is a person writing to a person, which is how this
// shop talks to people.

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch { /* no clipboard permission - the text is on screen anyway */ }
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-brand-line px-2 py-1.5 text-xs text-varnish transition-colors hover:text-chalk"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-turf" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'הועתק' : 'העתק טקסט'}
    </button>
  );
}

// Opens the message where the customer asked to be reached. Instagram has no
// way to carry a message in a link, so there the text is copied instead and
// the profile opens beside it.
function SendButtons({ channel, phone, email, instagramHandle, text, subject }) {
  const handle = String(instagramHandle || '').replace(/^@/, '');
  const digits = String(phone || '').replace(/\D/g, '');

  return (
    <div className="flex flex-wrap items-center gap-2">
      {channel === 'instagram' && handle ? (
        <a href={`https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg bg-turf px-3 py-1.5 text-xs font-bold text-pitch">
          <Instagram className="w-3.5 h-3.5" /> @{handle}
        </a>
      ) : channel === 'email' && email ? (
        <a href={`mailto:${email}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(text)}`}
          className="inline-flex items-center gap-1 rounded-lg bg-turf px-3 py-1.5 text-xs font-bold text-pitch">
          <Mail className="w-3.5 h-3.5" /> שלח מייל
        </a>
      ) : digits ? (
        <a href={whatsappLink(phone, text)} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg bg-turf px-3 py-1.5 text-xs font-bold text-pitch">
          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
        </a>
      ) : null}
      <CopyButton text={text} />
    </div>
  );
}

function Empty({ children }) {
  return <p className="text-sm text-varnish py-6 text-center">{children}</p>;
}

export default function Automations() {
  const [loading, setLoading] = useState(true);
  const [arrivals, setArrivals] = useState([]);
  const [reviewRows, setReviewRows] = useState([]);
  const [invites, setInvites] = useState({});
  const [inviteError, setInviteError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [shirtRequests, shirts, orders, inviteRows] = await Promise.all([
      base44.entities.ShirtRequest.list('-created_date', 300),
      base44.entities.Shirt.list('-created_date', 2000),
      base44.entities.InterestRequest.list('-created_date', 500),
      base44.entities.ReviewInvite.list('-created_date', 500).catch(() => []),
    ]);

    setArrivals(matchRequestsToShirts(shirtRequests, shirts));

    const inviteMap = Object.fromEntries((inviteRows || []).map(r => [r.order_id, r]));
    setInvites(inviteMap);

    // One order, however many shirts are on it.
    const groups = new Map();
    (orders || []).forEach(row => {
      const key = orderKey(row);
      if (!key) return;
      const group = groups.get(key);
      if (group) {
        group.items.push(row);
      } else {
        groups.set(key, {
          orderKey: key,
          items: [row],
          full_name: row.full_name,
          phone: row.phone,
          email: row.email,
          contact_channel: row.contact_channel,
          instagram_handle: row.instagram_handle || row.instagram,
          status: row.status,
          created_date: row.created_date,
          closedAt: row.updated_date,
        });
      }
    });

    setReviewRows(ordersAwaitingReview([...groups.values()], inviteMap));
    setLoading(false);
  }

  // The invite is made the first time it is needed, so an order that is never
  // chased never gets a link made for it.
  const openReviewMessage = async (group) => {
    setInviteError('');
    const win = window.open('', '_blank');
    try {
      const invite = invites[group.orderKey] || await inviteForOrder(group.orderKey, group.full_name);
      setInvites(p => ({ ...p, [group.orderKey]: invite }));
      const text = reviewRequestText({ fullName: group.full_name, inviteId: invite.id });
      if (group.contact_channel === 'instagram' && group.instagram_handle) {
        await navigator.clipboard.writeText(text).catch(() => {});
        if (win) win.location.href = `https://instagram.com/${String(group.instagram_handle).replace(/^@/, '')}`;
        return;
      }
      const url = whatsappLink(group.phone, text);
      if (win) win.location.href = url; else window.open(url, '_blank');
    } catch {
      win?.close();
      setInviteError('לא הצלחנו ליצור קישור ביקורת. אם supabase/review_invites.sql עוד לא רץ, זו הסיבה.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-black text-2xl text-turf mb-1 flex items-center gap-2">
          <Zap className="w-5 h-5" /> אוטומציות
        </h1>
        <p className="text-sm text-varnish font-body">
          הודעות שכדאי לשלוח עכשיו. שום דבר פה לא נשלח לבד - כל שורה פותחת הודעה מוכנה, ואתה שולח.
        </p>
      </div>

      {inviteError && (
        <p role="alert" className="mb-4 rounded-xl border border-redcard/30 bg-redcard/5 px-4 py-3 text-sm text-redcard">
          {inviteError}
        </p>
      )}

      {/* 1. The shirt they asked for turned up. */}
      <section className="rounded-2xl bg-white border border-brand-line p-5 mb-6">
        <h2 className="font-heading font-bold text-sm text-chalk uppercase mb-1 flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-turf" /> החולצה שביקשו הגיעה
          {arrivals.length > 0 && (
            <span className="rounded-full bg-turf px-2 py-0.5 text-[11px] text-pitch">{arrivals.length}</span>
          )}
        </h2>
        <p className="text-xs text-varnish mb-4">
          בקשות פתוחות שנכנסה אליהן חולצה מתאימה לקטלוג אחרי שביקשו אותה.
        </p>

        {arrivals.length === 0 ? (
          <Empty>אין בקשה פתוחה שהגיעה אליה חולצה. כשתעלה חולצה שמישהו חיפש, היא תופיע כאן.</Empty>
        ) : (
          <div className="space-y-4">
            {arrivals.map(({ request, matches }) => {
              const shirt = matches[0];
              const text = shirtArrivedText({ request, shirt });
              return (
                <div key={request.id} className="rounded-xl border border-brand-line p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <p className="font-bold text-sm text-chalk">
                      {request.full_name || 'לקוח'}
                      <span className="font-normal text-varnish"> ביקש {request.club}{request.season ? ` ${request.season}` : ''}</span>
                    </p>
                    <span className="text-xs text-varnish">{formatDate(request.created_date)}</span>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-2">
                    {matches.slice(0, 4).map(m => (
                      <Link key={m.id} to={`/admin/shirts?q=${encodeURIComponent(m.name)}`}
                        className="rounded-lg bg-brand-mist px-2 py-1 text-xs text-chalk hover:text-turf transition-colors">
                        {m.name}
                      </Link>
                    ))}
                    {matches.length > 4 && (
                      <span className="rounded-lg px-2 py-1 text-xs text-varnish">ועוד {matches.length - 4}</span>
                    )}
                  </div>

                  <pre className="mb-3 whitespace-pre-wrap rounded-lg bg-brand-mist p-3 text-xs text-chalk font-body">{text}</pre>

                  <SendButtons
                    channel={request.contact_channel}
                    phone={request.phone}
                    email={request.email}
                    instagramHandle={request.instagram_handle}
                    text={text}
                    subject="החולצה שביקשת הגיעה - JerseyLab"
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Orders that arrived and were never asked about. */}
      <section className="rounded-2xl bg-white border border-brand-line p-5">
        <h2 className="font-heading font-bold text-sm text-chalk uppercase mb-1 flex items-center gap-2">
          <Star className="w-4 h-4 text-brand-gold" /> תזכורת לביקורת
          {reviewRows.length > 0 && (
            <span className="rounded-full bg-turf px-2 py-0.5 text-[11px] text-pitch">{reviewRows.length}</span>
          )}
        </h2>
        <p className="text-xs text-varnish mb-4">
          הזמנות שנסגרו לפני יותר מ-{REVIEW_WAIT_DAYS} ימים ועדיין לא קיבלנו עליהן ביקורת.
        </p>

        {reviewRows.length === 0 ? (
          <Empty>כל ההזמנות הסגורות כבר נענו או שעוד מוקדם לבקש.</Empty>
        ) : (
          <div className="divide-y divide-brand-line/60">
            {reviewRows.map(group => (
              <div key={group.orderKey} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-chalk truncate">{group.full_name || 'לקוח'}</p>
                  <p className="text-xs text-varnish">
                    {group.items.length} פריטים · נסגרה {formatDate(group.closedAt)}
                    {group.reminded && ' · כבר נשלחה בקשה'}
                  </p>
                </div>
                <button type="button" onClick={() => openReviewMessage(group)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${group.reminded
                    ? 'border border-turf/40 text-turf hover:border-turf'
                    : 'bg-turf text-pitch'}`}>
                  {group.reminded ? 'בקש שוב' : 'בקש ביקורת'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
