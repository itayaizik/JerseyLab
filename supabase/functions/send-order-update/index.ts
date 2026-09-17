// Emails a customer that their order was changed from the admin panel, with
// what changed and the order as it now stands.
//
// Deploy from the Supabase dashboard (Edge Functions > Deploy a new function,
// name it send-order-update, paste this file) or with
// `supabase functions deploy send-order-update`. It uses the same
// RESEND_API_KEY secret as send-order-confirmation; SUPABASE_URL and
// SUPABASE_ANON_KEY are provided to every Edge Function automatically.
//
// Unlike the confirmation, this one sends only for a signed-in admin: the
// caller's session token is checked against Supabase Auth and the admin
// allowlist, so the endpoint cannot be used to mail arbitrary text to anyone.
//
// It looks like the confirmation (send-order-confirmation): navy and orange,
// Heebo, a white card. Keep the two in step when either changes.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const FROM = Deno.env.get('ORDER_FROM_EMAIL') ?? 'Jersey Lab <noreply@jerseylab.co>';
const SHOP_PHONE = '050-558-6255';
const WHATSAPP_URL = 'https://wa.me/972505586255';
const INSTAGRAM_URL = 'https://instagram.com/Jerseylabil';
const SITE_URL = 'https://www.jerseylab.co';

// Must match src/lib/adminEmails.js and public.is_admin() in rls_policies.sql.
const ADMIN_EMAILS = ['itayaizik8@gmail.com', 'itayaizik3@gmail.com'];

const NAVY = '#1B2A4A';
const ORANGE = '#E8622A';
const ORANGE_INK = '#C2501C';
const ORANGE_SOFT = '#FDF1EB';
const MIST = '#F3F5F8';
const LINE = '#E3E7EE';
const MUTED = '#6B7280';
// Heebo is the shop's font. Clients that load web fonts (Apple Mail, iOS)
// use it; Gmail never loads them, so the next fonts are the closest ones each
// system already has.
const FONT = "font-family:'Heebo','Segoe UI',Roboto,-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;";
const FONT_CSS = "@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&display=swap');";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const money = (n: unknown) => `₪${esc(Math.round(Number(n) || 0))}`;

interface OrderItem {
  name?: string;
  size?: string;
  player_version?: boolean;
  custom_name?: string;
  patches?: boolean;
  long_sleeve?: boolean;
  shorts?: boolean;
  notes?: string;
  price?: number;
}

async function isAdmin(req: Request): Promise<boolean> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  });
  if (!res.ok) return false;
  const user = await res.json();
  return ADMIN_EMAILS.includes(String(user?.email ?? '').toLowerCase());
}

// "עבור: דני | הערה לבוקס: ..." -> one line each.
function detailLines(notes: string | undefined): string {
  return String(notes || '').split(' | ').map(s => s.trim()).filter(Boolean).slice(0, 12).map(part => {
    const at = part.indexOf(':');
    const label = at > 0 ? part.slice(0, at).trim() : '';
    const value = at > 0 ? part.slice(at + 1).trim() : part;
    return `<p style="margin:3px 0 0; ${FONT} font-size:13px; line-height:1.5; color:${MUTED};">${
      label ? `<span style="color:${NAVY}; font-weight:500;">${esc(label)}:</span> ` : ''
    }${esc(value)}</p>`;
  }).join('');
}

function itemRow(item: OrderItem): string {
  const extras: string[] = [];
  if (item.player_version) extras.push('גרסת שחקן');
  if (item.custom_name) extras.push(`הדפסה: ${esc(item.custom_name)}`);
  if (item.long_sleeve) extras.push('שרוול ארוך');
  if (item.shorts) extras.push('מכנס קצר');
  if (item.patches) extras.push("פאצ'ים");
  return `
    <tr>
      <td style="padding:16px 0; border-bottom:1px solid ${LINE}; vertical-align:top;">
        <p style="margin:0; ${FONT} font-size:15px; font-weight:700; line-height:1.4; color:${NAVY};">${esc(item.name)}</p>
        <p style="margin:4px 0 0; ${FONT} font-size:13px; line-height:1.5; color:${NAVY};">
          ${item.size ? `<span style="display:inline-block; background-color:${MIST}; border-radius:6px; padding:1px 8px; font-weight:700;">מידה <span dir="ltr">${esc(item.size)}</span></span>` : ''}
          ${extras.length ? `<span style="color:${MUTED};">&nbsp;·&nbsp;${extras.join(' · ')}</span>` : ''}
        </p>
        ${detailLines(item.notes)}
      </td>
      <td style="padding:16px 0; border-bottom:1px solid ${LINE}; text-align:left; white-space:nowrap; vertical-align:top; width:80px;">
        <p style="margin:0; ${FONT} font-size:16px; font-weight:700; color:${NAVY};">${money(item.price)}</p>
      </td>
    </tr>`;
}

function buildHtml(fullName: string, changes: string[], items: OrderItem[], total: number, orderId: string): string {
  const firstName = fullName.trim().split(/\s+/)[0] || '';
  const count = items.length;
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light only">
<title>ההזמנה שלך עודכנה</title>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>${FONT_CSS}</style>
</head>
<body style="margin:0; padding:0; background-color:${MIST};">
  <div style="display:none; max-height:0; overflow:hidden;">עדכנו את ההזמנה שלך: ${esc(changes[0] || '')}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${MIST}; border-collapse:collapse;">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:560px; border-collapse:separate;">

        <!-- Header -->
        <tr><td align="center" style="background-color:${NAVY}; padding:22px 24px; border-radius:24px 24px 0 0;">
          <a href="${SITE_URL}" style="text-decoration:none;">
            <img src="${SITE_URL}/logo-navbar.png" alt="JERSEY LAB" height="44" style="height:44px; width:auto; display:block; border:0;">
          </a>
        </td></tr>
        <tr><td style="background-color:${ORANGE}; height:4px; line-height:4px; font-size:0;">&nbsp;</td></tr>

        <!-- Body -->
        <tr><td dir="rtl" style="background-color:#ffffff; padding:32px 28px 8px; text-align:right;">
          <div style="display:inline-block; background-color:${ORANGE_SOFT}; color:${ORANGE_INK}; border-radius:999px; padding:4px 12px; ${FONT} font-size:12px; font-weight:700;">✎ עדכון להזמנה</div>
          <h1 style="margin:14px 0 0; ${FONT} font-size:26px; line-height:1.3; font-weight:800; color:${NAVY};">היי${firstName ? ` ${esc(firstName)}` : ''}, ההזמנה שלך עודכנה</h1>
          <p style="margin:8px 0 0; ${FONT} font-size:15px; line-height:1.7; color:#4B5563;">
            עשינו כמה שינויים בהזמנה. הנה מה שהשתנה, וההזמנה כפי שהיא עכשיו.
          </p>

          <!-- What changed -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px; background-color:${ORANGE_SOFT}; border-radius:18px; border-collapse:separate;">
            <tr><td style="padding:16px 18px;">
              <p style="margin:0 0 8px; ${FONT} font-size:13px; font-weight:800; color:${ORANGE_INK};">מה השתנה</p>
              ${changes.map(c => `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td style="width:18px; padding:3px 0; vertical-align:top; ${FONT} font-size:14px; font-weight:800; color:${ORANGE};">•</td>
                  <td style="padding:3px 0; ${FONT} font-size:14px; line-height:1.6; color:${NAVY};">${esc(c)}</td>
                </tr>
              </table>`).join('')}
            </td></tr>
          </table>

          <!-- The order now -->
          <p style="margin:28px 0 0; ${FONT} font-size:13px; font-weight:800; color:${NAVY};">ההזמנה עכשיו · ${count} ${count === 1 ? 'פריט' : 'פריטים'}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            ${items.map(itemRow).join('')}
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px; border-collapse:collapse;">
            <tr>
              <td style="padding:12px 0 0; border-top:2px solid ${NAVY}; ${FONT} font-size:17px; font-weight:800; color:${NAVY};">סה"כ</td>
              <td style="padding:12px 0 0; border-top:2px solid ${NAVY}; ${FONT} font-size:24px; font-weight:800; color:${ORANGE_INK}; text-align:left;">${money(total)}</td>
            </tr>
          </table>

          <!-- Contact -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px; background-color:${NAVY}; border-radius:18px; border-collapse:separate;">
            <tr><td style="padding:18px 20px; text-align:right;">
              <p style="margin:0; ${FONT} font-size:15px; font-weight:700; color:#ffffff;">משהו לא מתאים?</p>
              <p style="margin:4px 0 14px; ${FONT} font-size:13px; line-height:1.6; color:#C9D1DE;">דברו איתנו ונסדר את זה.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
                <tr>
                  <td style="background-color:${ORANGE}; border-radius:12px;">
                    <a href="${WHATSAPP_URL}" style="display:inline-block; padding:10px 16px; ${FONT} font-size:14px; font-weight:700; color:#ffffff; text-decoration:none;">וואטסאפ <span dir="ltr">${SHOP_PHONE}</span></a>
                  </td>
                  <td style="width:8px;">&nbsp;</td>
                  <td style="border:1px solid #4A5874; border-radius:12px;">
                    <a href="${INSTAGRAM_URL}" style="display:inline-block; padding:9px 16px; ${FONT} font-size:14px; font-weight:700; color:#ffffff; text-decoration:none;">אינסטגרם</a>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

          <p style="margin:22px 0 24px; ${FONT} font-size:12px; color:#9CA3AF;">
            מספר הזמנה: <span dir="ltr">${esc(orderId)}</span>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="background-color:#ffffff; border-top:1px solid ${LINE}; padding:16px 24px; border-radius:0 0 24px 24px;">
          <p style="margin:0; ${FONT} font-size:12px; line-height:1.7; color:${MUTED};">
            <a href="${SITE_URL}" style="color:${NAVY}; font-weight:700; text-decoration:none;">jerseylab.co</a>
            &nbsp;·&nbsp;
            <a href="${SITE_URL}/legal/shipping" style="color:${MUTED}; text-decoration:underline;">משלוחים וביטולים</a>
            &nbsp;·&nbsp;
            <a href="${SITE_URL}/contact" style="color:${MUTED}; text-decoration:underline;">צור קשר</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!RESEND_API_KEY) return json({ error: 'RESEND_API_KEY is not set' }, 500);
  if (!(await isAdmin(req))) return json({ error: 'Admins only' }, 403);

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { email, full_name, order_id, changes, items, total } = payload ?? {};
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'A valid email is required' }, 400);
  }
  if (!Array.isArray(items) || items.length === 0) {
    return json({ error: 'items must be a non-empty array' }, 400);
  }
  if (!Array.isArray(changes) || changes.length === 0) {
    return json({ error: 'changes must be a non-empty array' }, 400);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: 'ההזמנה שלך עודכנה - Jersey Lab',
      html: buildHtml(String(full_name ?? ''), changes.map(String), items as OrderItem[], Number(total) || 0, String(order_id ?? '')),
    }),
  });

  if (!res.ok) return json({ error: 'Resend rejected the message', detail: await res.text() }, 502);
  return json({ ok: true });
});
