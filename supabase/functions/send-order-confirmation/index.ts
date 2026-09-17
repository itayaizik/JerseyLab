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
//
// The look follows the shop: navy and orange, Heebo, white cards on a light
// grey ground, rounded corners. Email clients ignore most of CSS, so it is
// built from tables with inline styles, and every colour is written out.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM = Deno.env.get('ORDER_FROM_EMAIL') ?? 'Jersey Lab <noreply@jerseylab.co>';
const SHOP_PHONE = '050-558-6255';
const WHATSAPP_URL = 'https://wa.me/972505586255';
const INSTAGRAM_URL = 'https://instagram.com/Jerseylabil';
const SITE_URL = 'https://www.jerseylab.co';

const NAVY = '#1B2A4A';
const ORANGE = '#E8622A';
const ORANGE_INK = '#C2501C';
const ORANGE_SOFT = '#FDF1EB';
const MIST = '#F3F5F8';
const LINE = '#E3E7EE';
const MUTED = '#6B7280';
const GREEN = '#047857';
const FONT = "font-family:'Heebo',Arial,Helvetica,sans-serif;";

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

const money = (n: unknown) => `₪${esc(Math.round(Number(n) || 0))}`;

interface Detail { label?: string; value?: string }

interface OrderItem {
  name?: string;
  size?: string;
  player_version?: boolean;
  custom_name?: string;
  patches?: boolean;
  long_sleeve?: boolean;
  shorts?: boolean;
  price?: number;
  details?: Detail[];
  // Older callers send the details joined into one line.
  notes?: string;
}

const COUPON_LABEL = 'קופון';

function detailsOf(item: OrderItem): Detail[] {
  if (Array.isArray(item.details)) return item.details.slice(0, 12);
  return String(item.notes || '').split(' | ').filter(Boolean).map(part => {
    const at = part.indexOf(':');
    return at > 0 ? { label: part.slice(0, at).trim(), value: part.slice(at + 1).trim() } : { value: part };
  });
}

function itemRow(item: OrderItem): string {
  const extras: string[] = [];
  if (item.player_version) extras.push('גרסת שחקן');
  if (item.custom_name) extras.push(`הדפסה: ${esc(item.custom_name)}`);
  if (item.long_sleeve) extras.push('שרוול ארוך');
  if (item.shorts) extras.push('מכנס קצר');
  if (item.patches) extras.push("פאצ'ים");

  const details = detailsOf(item);
  const coupon = details.find(d => d.label === COUPON_LABEL);
  const saved = Number(String(coupon?.value || '').match(/-₪\s*(\d+)/)?.[1] || 0);
  const lines = details
    .filter(d => d.label !== COUPON_LABEL)
    .map(d => `<p style="margin:3px 0 0; ${FONT} font-size:13px; line-height:1.5; color:${MUTED};">${
      d.label ? `<span style="color:${NAVY}; font-weight:500;">${esc(d.label)}:</span> ` : ''
    }${esc(d.value)}</p>`)
    .join('');

  return `
    <tr>
      <td style="padding:16px 0; border-bottom:1px solid ${LINE}; vertical-align:top;">
        <p style="margin:0; ${FONT} font-size:15px; font-weight:700; line-height:1.4; color:${NAVY};">${esc(item.name)}</p>
        <p style="margin:4px 0 0; ${FONT} font-size:13px; line-height:1.5; color:${NAVY};">
          <span style="display:inline-block; background-color:${MIST}; border-radius:6px; padding:1px 8px; font-weight:700;">מידה <span dir="ltr">${esc(item.size)}</span></span>
          ${extras.length ? `<span style="color:${MUTED};">&nbsp;·&nbsp;${extras.join(' · ')}</span>` : ''}
        </p>
        ${lines}
        ${saved ? `<p style="margin:6px 0 0; ${FONT} font-size:13px; font-weight:500; color:${GREEN};">חסכת ₪${saved} בקופון</p>` : ''}
      </td>
      <td style="padding:16px 0 16px 0; border-bottom:1px solid ${LINE}; text-align:left; white-space:nowrap; vertical-align:top; width:80px;">
        ${saved ? `<p style="margin:0; ${FONT} font-size:12px; color:${MUTED}; text-decoration:line-through;">${money((Number(item.price) || 0) + saved)}</p>` : ''}
        <p style="margin:0; ${FONT} font-size:16px; font-weight:700; color:${NAVY};">${money(item.price)}</p>
      </td>
    </tr>`;
}

function step(n: number, title: string, text: string): string {
  return `
    <tr>
      <td style="width:36px; padding:8px 0; vertical-align:top;">
        <div style="width:26px; height:26px; line-height:26px; border-radius:13px; background-color:${ORANGE}; color:#ffffff; text-align:center; ${FONT} font-size:13px; font-weight:700;">${n}</div>
      </td>
      <td style="padding:8px 0; vertical-align:top;">
        <p style="margin:0; ${FONT} font-size:14px; font-weight:700; color:${NAVY};">${title}</p>
        <p style="margin:2px 0 0; ${FONT} font-size:13px; line-height:1.55; color:${MUTED};">${text}</p>
      </td>
    </tr>`;
}

interface Totals { total: number; discount: number; couponCode: string }

function buildHtml(fullName: string, items: OrderItem[], totals: Totals, orderId: string): string {
  const firstName = fullName.trim().split(/\s+/)[0] || '';
  const count = items.length;
  const subtotal = totals.total + totals.discount;
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light only">
<title>ההזמנה התקבלה</title>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:${MIST};">
  <div style="display:none; max-height:0; overflow:hidden;">קיבלנו את ההזמנה שלך (${count} ${count === 1 ? 'פריט' : 'פריטים'}, ${money(totals.total)}). נחזור אליך בהקדם.</div>
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
          <div style="display:inline-block; background-color:${ORANGE_SOFT}; color:${ORANGE_INK}; border-radius:999px; padding:4px 12px; ${FONT} font-size:12px; font-weight:700;">✓ ההזמנה התקבלה</div>
          <h1 style="margin:14px 0 0; ${FONT} font-size:26px; line-height:1.3; font-weight:800; color:${NAVY};">תודה${firstName ? `, ${esc(firstName)}` : ''}!</h1>
          <p style="margin:8px 0 0; ${FONT} font-size:15px; line-height:1.7; color:#4B5563;">
            קיבלנו את ההזמנה שלך ואנחנו כבר עליה. באתר לא מתבצע תשלום - נחזור אליך בקרוב כדי לאשר את הפרטים.
          </p>

          <!-- What happens next -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px; background-color:${MIST}; border-radius:18px; border-collapse:separate;">
            <tr><td style="padding:14px 18px;">
              <p style="margin:0 0 4px; ${FONT} font-size:13px; font-weight:800; color:${NAVY};">מה קורה עכשיו</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                ${step(1, 'נחזור אליך', 'בוואטסאפ או באינסטגרם, לפי מה שבחרת, לאישור ההזמנה.')}
                ${step(2, 'תשלום', 'מתואם איתך ישירות אחרי האישור.')}
                ${step(3, 'משלוח', 'עד 3 שבועות מרגע האישור והתשלום.')}
              </table>
            </td></tr>
          </table>

          <!-- Items -->
          <p style="margin:28px 0 0; ${FONT} font-size:13px; font-weight:800; color:${NAVY};">ההזמנה שלך · ${count} ${count === 1 ? 'פריט' : 'פריטים'}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            ${items.map(itemRow).join('')}
          </table>

          <!-- Totals -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px; border-collapse:collapse;">
            ${totals.discount > 0 ? `
            <tr>
              <td style="padding:3px 0; ${FONT} font-size:14px; color:${MUTED};">לפני הנחה</td>
              <td style="padding:3px 0; ${FONT} font-size:14px; color:${MUTED}; text-align:left;">${money(subtotal)}</td>
            </tr>
            <tr>
              <td style="padding:3px 0; ${FONT} font-size:14px; font-weight:500; color:${GREEN};">הנחת קופון${totals.couponCode ? ` <span dir="ltr" style="display:inline-block; border:1px dashed ${GREEN}; border-radius:6px; padding:0 6px; font-size:12px;">${esc(totals.couponCode)}</span>` : ''}</td>
              <td style="padding:3px 0; ${FONT} font-size:14px; font-weight:500; color:${GREEN}; text-align:left;">${money(totals.discount)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:12px 0 0; border-top:2px solid ${NAVY}; ${FONT} font-size:17px; font-weight:800; color:${NAVY};">סה"כ</td>
              <td style="padding:12px 0 0; border-top:2px solid ${NAVY}; ${FONT} font-size:24px; font-weight:800; color:${ORANGE_INK}; text-align:left;">${money(totals.total)}</td>
            </tr>
          </table>

          <!-- Contact -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px; background-color:${NAVY}; border-radius:18px; border-collapse:separate;">
            <tr><td style="padding:18px 20px; text-align:right;">
              <p style="margin:0; ${FONT} font-size:15px; font-weight:700; color:#ffffff;">רוצים שנטפל מהר יותר?</p>
              <p style="margin:4px 0 14px; ${FONT} font-size:13px; line-height:1.6; color:#C9D1DE;">שלחו לנו הודעה ישירות ונסגור את ההזמנה מהר יותר.</p>
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

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { email, full_name, order_id, items, total, discount, coupon_code } = payload ?? {};
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'A valid email is required' }, 400);
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 60) {
    return json({ error: 'items must be a non-empty array' }, 400);
  }

  const totals: Totals = {
    total: Number(total) || 0,
    discount: Math.max(0, Number(discount) || 0),
    couponCode: typeof coupon_code === 'string' ? coupon_code.slice(0, 40) : '',
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: 'ההזמנה שלך התקבלה - Jersey Lab',
      html: buildHtml(String(full_name ?? ''), items as OrderItem[], totals, String(order_id ?? '')),
    }),
  });

  if (!res.ok) {
    return json({ error: 'Resend rejected the message', detail: await res.text() }, 502);
  }
  return json({ ok: true });
});
