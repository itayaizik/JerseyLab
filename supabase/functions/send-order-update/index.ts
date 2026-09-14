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

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const FROM = Deno.env.get('ORDER_FROM_EMAIL') ?? 'Jersey Lab <noreply@jerseylab.co>';
const SHOP_PHONE = '050-558-6255';
const WHATSAPP_URL = 'https://wa.me/972505586255';
const INSTAGRAM_URL = 'https://instagram.com/Jerseylabil';

// Must match src/lib/adminEmails.js and public.is_admin() in rls_policies.sql.
const ADMIN_EMAILS = ['itayaizik8@gmail.com', 'itayaizik3@gmail.com'];

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

interface OrderItem {
  name?: string;
  size?: string;
  player_version?: boolean;
  custom_name?: string;
  patches?: boolean;
  long_sleeve?: boolean;
  shorts?: boolean;
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

const font = "font-family:'Heebo',Arial,sans-serif;";

function itemRow(item: OrderItem): string {
  const extras: string[] = [];
  if (item.player_version) extras.push('גרסת שחקן');
  if (item.custom_name) extras.push(`הדפסה: ${esc(item.custom_name)}`);
  if (item.long_sleeve) extras.push('שרוול ארוך');
  if (item.shorts) extras.push('מכנס קצר');
  if (item.patches) extras.push("פאצ'ים");
  return `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid #E3E7EE;">
        <p style="margin:0; ${font} font-size:14px; font-weight:700; color:#1B2A4A;">${esc(item.name)}</p>
        <p style="margin:2px 0 0; ${font} font-size:12px; color:#6B7280;">
          מידה: ${esc(item.size)}${extras.length ? ' · ' + extras.join(' · ') : ''}
        </p>
      </td>
      <td style="padding:12px 0; border-bottom:1px solid #E3E7EE; text-align:left; white-space:nowrap; vertical-align:top;">
        <span style="${font} font-size:14px; font-weight:700; color:#1B2A4A;">₪${esc(item.price)}</span>
      </td>
    </tr>`;
}

function buildHtml(fullName: string, changes: string[], items: OrderItem[], total: number, orderId: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>ההזמנה שלך עודכנה</title></head>
<body style="margin:0; padding:0; background-color:#F3F5F8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F3F5F8; border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px; width:100%; border-collapse:collapse;">
        <tr><td align="center" style="background-color:#1B2A4A; padding:18px; border-radius:20px 20px 0 0;">
          <img src="https://www.jerseylab.co/logo-navbar.png" alt="JERSEY LAB" height="44" style="height:44px; width:auto; display:block; border:0;">
        </td></tr>
        <tr><td dir="rtl" style="background-color:#ffffff; padding:32px 28px; text-align:right; border-radius:0 0 20px 20px;">
          <h1 style="margin:0; ${font} font-size:24px; font-weight:700; color:#1B2A4A;">ההזמנה שלך עודכנה</h1>
          <p style="margin:6px 0 0; ${font} font-size:14px; line-height:1.7; color:#4B5563;">היי ${esc(fullName)}, עשינו כמה שינויים בהזמנה שלך:</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px; background-color:#FDF1EB; border-radius:14px; border-collapse:separate;">
            <tr><td style="padding:14px 16px;">
              ${changes.map(c => `<p style="margin:0 0 4px; ${font} font-size:13px; line-height:1.6; color:#1B2A4A;">• ${esc(c)}</p>`).join('')}
            </td></tr>
          </table>

          <p style="margin:24px 0 0; ${font} font-size:13px; font-weight:700; color:#1B2A4A;">ההזמנה עכשיו</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            ${items.map(itemRow).join('')}
            <tr>
              <td style="padding:14px 0 0; ${font} font-size:15px; font-weight:700; color:#1B2A4A;">סה"כ</td>
              <td style="padding:14px 0 0; text-align:left;"><span style="${font} font-size:20px; font-weight:700; color:#C2501C;">₪${esc(total)}</span></td>
            </tr>
          </table>

          <p style="margin:24px 0 0; ${font} font-size:13px; line-height:1.8; color:#4B5563;">
            אם משהו לא מתאים, דברו איתנו:<br>
            <a href="${WHATSAPP_URL}" style="color:#1B2A4A; font-weight:700; text-decoration:none;">WhatsApp <span dir="ltr">${SHOP_PHONE}</span></a> ·
            <a href="${INSTAGRAM_URL}" style="color:#1B2A4A; font-weight:700; text-decoration:none;">Instagram <span dir="ltr">@Jerseylabil</span></a>
          </p>
          <p style="margin:20px 0 0; padding-top:14px; border-top:1px solid #E3E7EE; ${font} font-size:11px; color:#9CA3AF;">
            מספר הזמנה: <span dir="ltr">${esc(orderId)}</span>
          </p>
        </td></tr>
      </table>
      <p style="margin:18px 0 0; ${font} font-size:12px; color:#6B7280;">Jersey Lab &middot; jerseylab.co</p>
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
