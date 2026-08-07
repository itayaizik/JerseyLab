// Sends the customer an order-confirmation email via Resend.
//
// Lives server-side because it needs RESEND_API_KEY, which must never reach the
// browser. Deploy from the Supabase dashboard (Edge Functions > Deploy a new
// function) or with `supabase functions deploy send-order-confirmation`, then
// set the secret:
//   supabase secrets set RESEND_API_KEY=...   (or Edge Functions > Secrets)
//
// The storefront calls this best-effort: the order row is already written, so a
// failure here must never read to the customer as a failed checkout.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM = Deno.env.get('ORDER_FROM_EMAIL') ?? 'Jersey Lab <noreply@jerseylab.co>';
const SHOP_PHONE = '050-558-6255';
const WHATSAPP_URL = 'https://wa.me/972505586255';
const INSTAGRAM_URL = 'https://instagram.com/Jerseylabil';

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

// Order details are customer-supplied, so everything interpolated into the
// email body gets escaped rather than trusted.
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
  local_stock?: boolean;
  price?: number;
}

function itemRow(item: OrderItem): string {
  const extras: string[] = [];
  if (item.player_version) extras.push('גרסת שחקן');
  if (item.custom_name) extras.push(`הדפסה: ${esc(item.custom_name)}`);
  const eta = item.local_stock ? 'מלאי בארץ — עד שבוע' : 'משלוח מהיר — עד 3 שבועות';

  return `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid #e5ded0;">
        <p style="margin:0; font-family:'Assistant',Arial,sans-serif; font-size:14px; font-weight:700; color:#1B2A4A;">${esc(item.name)}</p>
        <p style="margin:2px 0 0; font-family:'Assistant',Arial,sans-serif; font-size:12px; color:#6B7280;">
          מידה: ${esc(item.size)}${extras.length ? ' · ' + extras.join(' · ') : ''}
        </p>
        <p style="margin:2px 0 0; font-family:'Assistant',Arial,sans-serif; font-size:11px; color:#E8622A;">${eta}</p>
      </td>
      <td style="padding:12px 0; border-bottom:1px solid #e5ded0; text-align:left; white-space:nowrap; vertical-align:top;">
        <span style="font-family:'Space Mono','Courier New',monospace; font-size:14px; font-weight:700; color:#1B2A4A;">₪${esc(item.price)}</span>
      </td>
    </tr>`;
}

function buildHtml(fullName: string, items: OrderItem[], total: number, orderId: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>ההזמנה התקבלה</title></head>
<body style="margin:0; padding:0; background-color:#E8DFC8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E8DFC8; background-image:linear-gradient(rgba(27,42,74,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(27,42,74,0.08) 1px, transparent 1px); background-size:28px 28px; border-collapse:collapse;">
    <tr><td align="center" style="padding:48px 16px;">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="ltr" style="border-collapse:collapse;">
        <tr>
          <td colspan="2" align="center" bgcolor="#1B2A4A" style="background-color:#1B2A4A; padding:8px 16px;">
            <img src="https://media.base44.com/images/public/6a42e762005950f7dc39df84/f2c515307_image-removebg-preview2.png" alt="JERSEY LAB" height="60" style="height:60px; width:auto; display:block; border:0;">
          </td>
          <td width="4" bgcolor="#E8622A" style="width:4px; background-color:#E8622A; border-top:4px solid #E8DFC8; font-size:0; line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td width="4" height="4" style="width:4px; height:4px; font-size:0; line-height:0;">&nbsp;</td>
          <td colspan="2" height="4" bgcolor="#E8622A" style="height:4px; background-color:#E8622A; font-size:0; line-height:0;">&nbsp;</td>
        </tr>
      </table>

      <div style="height:12px; line-height:12px; font-size:0;">&nbsp;</div>

      <h1 style="margin:0; font-family:'Oswald','Arial Narrow',Arial,sans-serif; font-weight:700; font-size:24px; line-height:32px; letter-spacing:0.6px; text-transform:uppercase; color:#1B2A4A; text-align:center;">ההזמנה התקבלה</h1>
      <p style="margin:4px 0 0; font-family:'Assistant',Arial,sans-serif; font-size:14px; line-height:20px; color:#6B7280; text-align:center;">תודה, ${esc(fullName)}!</p>

      <div style="height:32px; line-height:32px; font-size:0;">&nbsp;</div>

      <table role="presentation" width="453" cellpadding="0" cellspacing="0" border="0" dir="ltr" style="max-width:453px; width:100%; border-collapse:collapse;">
        <tr>
          <td colspan="2" style="padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border:2px solid #1B2A4A; border-collapse:collapse;">
              <tr><td dir="rtl" style="padding:32px 29px 32px 32px; text-align:right;">

                <p style="margin:0 0 16px; font-family:'Assistant',Arial,sans-serif; font-size:14px; line-height:1.7; color:#1B2A4A;">
                  קיבלנו את ההזמנה שלך ואנחנו כבר עליה. נחזור אליך בהקדם לאישור הפרטים הסופיים.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                  ${items.map(itemRow).join('')}
                  <tr>
                    <td style="padding:14px 0 0; font-family:'Oswald','Arial Narrow',Arial,sans-serif; font-weight:700; font-size:14px; text-transform:uppercase; color:#1B2A4A;">סה"כ</td>
                    <td style="padding:14px 0 0; text-align:left;">
                      <span style="font-family:'Space Mono','Courier New',monospace; font-size:20px; font-weight:700; color:#E8622A;">₪${esc(total)}</span>
                    </td>
                  </tr>
                </table>

                <div style="height:20px; line-height:20px; font-size:0;">&nbsp;</div>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F2ECD9; border-collapse:collapse;">
                  <tr><td style="padding:14px; text-align:right;">
                    <p style="margin:0 0 6px; font-family:'Oswald','Arial Narrow',Arial,sans-serif; font-weight:700; font-size:13px; text-transform:uppercase; color:#1B2A4A;">רוצה טיפול מהיר יותר?</p>
                    <p style="margin:0 0 10px; font-family:'Assistant',Arial,sans-serif; font-size:13px; line-height:1.6; color:#1B2A4A;">
                      מוזמנים לשלוח לנו הודעה ישירות — נענה ונסגור את ההזמנה מהר יותר.
                    </p>
                    <p style="margin:0; font-family:'Assistant',Arial,sans-serif; font-size:13px; line-height:1.9; color:#1B2A4A;">
                      <a href="${WHATSAPP_URL}" style="color:#1B2A4A; font-weight:700; text-decoration:none;">WhatsApp <span dir="ltr">${SHOP_PHONE}</span></a><br>
                      <a href="${INSTAGRAM_URL}" style="color:#1B2A4A; font-weight:700; text-decoration:none;">Instagram <span dir="ltr">@Jerseylabil</span></a>
                    </p>
                  </td></tr>
                </table>

                <div style="height:20px; line-height:20px; font-size:0;">&nbsp;</div>

                <div style="border-top:2px solid rgba(27,42,74,0.2); padding-top:16px;">
                  <p style="margin:0; font-family:'Assistant',Arial,sans-serif; font-size:12px; line-height:16px; color:#9CA3AF;">
                    מספר הזמנה: <span dir="ltr">${esc(orderId)}</span>
                  </p>
                </div>

              </td></tr>
            </table>
          </td>
          <td width="5" bgcolor="#E8622A" style="width:5px; background-color:#E8622A; border-top:5px solid #E8DFC8; font-size:0; line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td width="5" height="5" style="width:5px; height:5px; font-size:0; line-height:0;">&nbsp;</td>
          <td colspan="2" height="5" bgcolor="#E8622A" style="height:5px; background-color:#E8622A; font-size:0; line-height:0;">&nbsp;</td>
        </tr>
      </table>

      <p style="margin:20px 0 0; font-family:'Assistant',Arial,sans-serif; font-size:14px; line-height:20px; color:#4B5563; text-align:center;">Jersey Lab &middot; jerseylab.co</p>

    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!RESEND_API_KEY) return json({ error: 'RESEND_API_KEY is not set' }, 500);

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { email, full_name, order_id, items, total } = payload ?? {};
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'A valid email is required' }, 400);
  }
  if (!Array.isArray(items) || items.length === 0) {
    return json({ error: 'items must be a non-empty array' }, 400);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: 'ההזמנה שלך התקבלה — Jersey Lab',
      html: buildHtml(String(full_name ?? ''), items as OrderItem[], Number(total) || 0, String(order_id ?? '')),
    }),
  });

  if (!res.ok) {
    return json({ error: 'Resend rejected the message', detail: await res.text() }, 502);
  }
  return json({ ok: true });
});
