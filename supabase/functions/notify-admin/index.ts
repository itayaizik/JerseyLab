// Emails the shop owner whenever a customer sends an order or an enquiry, so a
// new request does not sit unseen until someone opens the admin panel.
//
// Lives server-side because it needs RESEND_API_KEY, which must never reach the
// browser. Deploy from the Supabase dashboard (Edge Functions > Deploy a new
// function) or with `supabase functions deploy notify-admin`. It reuses the
// RESEND_API_KEY secret the order-confirmation function already uses; set
// ADMIN_NOTIFY_EMAIL to change who gets notified (comma-separated for several).
//
// The storefront calls this best-effort: the row is already written by the time
// we get here, so a mail failure must never read to the customer as a failure.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM = Deno.env.get('ORDER_FROM_EMAIL') ?? 'Jersey Lab <noreply@jerseylab.co>';
const TO = (Deno.env.get('ADMIN_NOTIFY_EMAIL') ?? 'itayaizik8@gmail.com')
  .split(',')
  .map((address) => address.trim())
  .filter(Boolean);

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

// Every value here is customer-supplied, so nothing is interpolated unescaped.
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface NotifyPayload {
  kind?: 'order' | 'enquiry';
  title?: string;
  reference?: string;
  reply_to?: string;
  // Label/value pairs — whatever the caller wants shown, in order.
  fields?: { label?: string; value?: string }[];
  // Free-text block shown last (the customer's own message).
  body?: string;
}

function fieldRow(field: { label?: string; value?: string }): string {
  if (!field?.value) return '';
  return `
    <tr>
      <td style="padding:6px 0;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top;">${esc(field.label)}</td>
      <td style="padding:6px 0 6px 12px;color:#1B2A4A;font-size:14px;font-weight:bold;">${esc(field.value)}</td>
    </tr>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // Checked before the payload so a misconfigured deployment is distinguishable
  // from a bad request in the logs.
  if (!RESEND_API_KEY) return json({ error: 'RESEND_API_KEY is not set' }, 500);
  if (!TO.length) return json({ error: 'ADMIN_NOTIFY_EMAIL is not set' }, 500);

  let payload: NotifyPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid JSON body' }, 400);
  }

  const title = (payload.title || '').trim();
  if (!title) return json({ error: 'title is required' }, 400);

  const isOrder = payload.kind !== 'enquiry';
  const accent = isOrder ? '#E8622A' : '#1B2A4A';
  const heading = isOrder ? 'הזמנה חדשה' : 'פנייה חדשה';
  const rows = (payload.fields || []).map(fieldRow).join('');
  const body = (payload.body || '').trim();

  const html = `<!doctype html>
<html dir="rtl" lang="he"><body style="margin:0;padding:24px;background:#F2ECD9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:2px solid #1B2A4A;">
    <tr>
      <td style="background:${accent};padding:16px 20px;">
        <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">${esc(heading)}</p>
        ${payload.reference ? `<p style="margin:4px 0 0;color:#ffffff;opacity:0.75;font-size:13px;font-family:monospace;">${esc(payload.reference)}</p>` : ''}
      </td>
    </tr>
    <tr>
      <td style="padding:20px;">
        <p style="margin:0 0 14px;color:#1B2A4A;font-size:16px;font-weight:bold;">${esc(title)}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table>
        ${body ? `<div style="margin-top:16px;padding:12px;background:#F2ECD9;border-right:3px solid ${accent};color:#1B2A4A;font-size:14px;line-height:1.6;white-space:pre-wrap;">${esc(body)}</div>` : ''}
      </td>
    </tr>
    <tr>
      <td style="padding:0 20px 20px;">
        <a href="https://jerseylab.co/admin/requests" style="display:inline-block;background:#1B2A4A;color:#ffffff;padding:12px 20px;font-size:14px;font-weight:bold;text-decoration:none;">פתח בפאנל הניהול</a>
      </td>
    </tr>
  </table>
</body></html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: TO,
      subject: `${heading}: ${title}`,
      html,
      // Lets the owner reply straight from the notification to the customer.
      ...(payload.reply_to ? { reply_to: payload.reply_to } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return json({ error: 'resend rejected the message', detail }, 502);
  }

  return json({ ok: true });
});
