import fs from 'node:fs';
import path from 'node:path';

const BRAND = '#ff5c1a';
const INK = '#141210';
const MUTED = '#6b6560';

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout({ title, preview, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f2ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ef;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e2dd;">
      <tr><td style="background:${INK};padding:18px 24px;">
        <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:.04em;">GREYFIRE</span>
        <span style="color:${BRAND};font-size:18px;font-weight:800;letter-spacing:.04em;"> STUDIO</span>
      </td></tr>
      <tr><td style="padding:26px 24px 8px;">
        <h1 style="margin:0 0 6px;font-size:20px;line-height:1.3;color:${INK};">${escapeHtml(title)}</h1>
      </td></tr>
      <tr><td style="padding:0 24px 26px;color:${INK};font-size:14px;line-height:1.6;">${body}</td></tr>
      <tr><td style="padding:14px 24px;background:#faf8f6;border-top:1px solid #eceae7;color:${MUTED};font-size:11px;line-height:1.5;">
        Greyfire Studio &middot; digital comics and character files
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function button(href, label, color) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 10px 10px 0;">
  <tr><td style="border-radius:8px;background:${color};">
    <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 20px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
  </td></tr></table>`;
}

function rows(pairs) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px;">
  ${pairs
    .map(
      ([label, value]) =>
        `<tr><td style="padding:7px 0;color:${MUTED};width:42%;vertical-align:top;">${escapeHtml(label)}</td>
         <td style="padding:7px 0;color:${INK};font-weight:600;">${escapeHtml(value)}</td></tr>`
    )
    .join('')}
</table>`;
}

/** Full-page HTML for endpoints a human lands on directly, e.g. email action links. */
export function page({ title, heading, body = '', actions = '', footer = '' }) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(
    title
  )}</title></head>
<body style="margin:0;padding:0;background:#f4f2ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ef;padding:40px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #e6e2dd;border-radius:14px;overflow:hidden;">
<tr><td style="background:${INK};padding:18px 24px;">
<span style="color:#fff;font-size:17px;font-weight:800;letter-spacing:.04em;">GREYFIRE</span><span style="color:${BRAND};font-size:17px;font-weight:800;letter-spacing:.04em;"> STUDIO</span>
</td></tr>
<tr><td style="padding:30px 26px 8px;">
<h1 style="margin:0 0 10px;font-size:21px;line-height:1.3;color:${INK};">${escapeHtml(heading)}</h1>
${body ? `<div style="color:${INK};font-size:14px;line-height:1.65;">${body}</div>` : ''}
</td></tr>
${actions ? `<tr><td style="padding:6px 26px 26px;">${actions}</td></tr>` : ''}
<tr><td style="padding:14px 26px;background:#faf8f6;border-top:1px solid #eceae7;color:${MUTED};font-size:11px;">${
    escapeHtml(footer) || 'Greyfire Studio'
  }</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function actionButton(href, label, color) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 10px 10px 0;"><tr><td style="border-radius:8px;background:${color};"><a href="${escapeHtml(
    href
  )}" style="display:inline-block;padding:12px 20px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;">${escapeHtml(
    label
  )}</a></td></tr></table>`;
}

export { button as mailButton, rows as detailRows };


export function createMailer({
  from,
  adminEmail,
  baseUrl,
  outboxDir = null,
  transport = null,
  smtp = null,
} = {}) {
  let cached = null;

  const config = () => {
    const host = process.env.SMTP_HOST || (smtp && smtp.host) || '';
    const port = Number(process.env.SMTP_PORT || (smtp && smtp.port) || 587);
    const user = process.env.SMTP_USER || (smtp && smtp.user) || '';
    const pass = process.env.SMTP_PASS || (smtp && smtp.pass) || '';
    const secure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : port === 465;
    const requested = String(process.env.MAIL_TRANSPORT || '').toLowerCase();
    const mode = requested === 'none' ? 'none' : requested === 'console' ? 'console' : host ? 'smtp' : 'console';
    return {
      mode,
      host,
      port,
      user,
      pass,
      secure,
      from: process.env.MAIL_FROM || from || (user ? `${user}` : 'Greyfire Studio <no-reply@localhost>'),
      adminEmail: process.env.ADMIN_EMAIL || adminEmail || '',
      baseUrl: String(process.env.PUBLIC_BASE_URL || baseUrl || '').replace(/\/+$/, ''),
    };
  };

  const transporter = (cfg) => {
    if (transport) return transport;
    if (cached?.key === cfg.key) return cached.value;
    // Required lazily so a project that never sends mail does not pay the import.
    const key = `${cfg.host}:${cfg.port}:${cfg.user}:${cfg.secure}`;
    const value = null;
    cached = { key, value };
    return value;
  };

  const writeOutbox = (file, message) => {
    if (!outboxDir) return;
    try {
      fs.mkdirSync(outboxDir, { recursive: true });
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.html`;
      fs.writeFileSync(path.join(outboxDir, name), message.html);
    } catch {
      /* outbox is a dev convenience only */
    }
  };

  const send = async (message) => {
    const cfg = config();
    const to = Array.isArray(message.to) ? message.to : [message.to];
    const clean = to.filter(Boolean);
    if (!clean.length) return { ok: false, skipped: true, reason: 'no_recipient' };
    if (cfg.mode === 'none') return { ok: false, skipped: true, reason: 'disabled' };

    if (cfg.mode === 'console' || !cfg.host) {
      writeOutbox(
        clean.join(','),
        message
      );
      console.log(`[mail:console] -> ${clean.join(', ')} :: ${message.subject}`);
      if (message.attachments?.length) {
        console.log(`[mail:console]    ${message.attachments.length} attachment(s) skipped`);
      }
      return { ok: true, mode: 'console' };
    }

    try {
      const { createTransport } = await import('nodemailer');
      const tr =
        transporter(cfg) ||
        createTransport({
          host: cfg.host,
          port: cfg.port,
          secure: cfg.secure,
          auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
        });
      const info = await tr.sendMail({
        from: message.from || cfg.from,
        to: clean.join(', '),
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments,
      });
      return { ok: true, mode: 'smtp', messageId: info?.messageId || null };
    } catch (error) {
      console.error('[mail:smtp] send failed:', error?.message || error);
      return { ok: false, mode: 'smtp', reason: 'send_failed', error: error?.message || String(error) };
    }
  };

  const absolute = (target) =>
    /^https?:\/\//i.test(target) ? target : `${config().baseUrl}${target.startsWith('/') ? target : `/${target}`}`;

  return {
    config,
    mode: () => config().mode,
    isConfigured: () => Boolean(config().host) && config().mode !== 'none',
    send,
    absolute,

    /** To the site owner the moment a new order needs a human decision. */
    async adminOrderAlert({ order, approveUrl, rejectUrl, proof = null }) {
      const cfg = config();
      if (!cfg.adminEmail) {
        console.warn('[mail] adminOrderAlert skipped — set ADMIN_EMAIL to receive order alerts.');
        return { ok: false, skipped: true, reason: 'no_admin_email' };
      }
      const items = (order.items || [])
        .map((item) => `${item.title} &times; ${item.qty}`)
        .join('<br>');
      const attachments = [];
      if (proof?.buffer) {
        attachments.push({
          filename: proof.filename,
          content: proof.buffer,
          contentType: proof.mime,
          contentId: proof.cid,
        });
      }
      const html = layout({
        title: `Payment to review — ${order.id}`,
        preview: `${order.buyer?.name || 'A customer'} sent ${order.total} for order ${order.id}.`,
        body: `
          <p>A new order is waiting for a payment check.</p>
          ${rows([
            ['Order ID', order.id],
            ['Customer', `${order.buyer?.name || '—'}${order.buyer?.email ? ` (${order.buyer.email})` : ''}`],
            ['Venmo handle', order.buyer?.handle || order.payment?.payer || '—'],
            ['Transaction ID', order.payment?.transactionId || order.buyer?.transactionId || '—'],
            ['Amount due', order.total],
            ['Payment note', order.paymentNote],
            ['Items', ''],
          ])}
          <p style="margin:0 0 4px;color:${MUTED};font-size:13px;">${items}</p>
          ${
            proof?.buffer
              ? `<p style="margin:16px 0 4px;"><img src="cid:${proof.cid}" alt="Payment screenshot" style="max-width:100%;border:1px solid #e6e2dd;border-radius:10px;"></p>`
              : '<p style="margin:12px 0 0;color:#b23c17;">No payment screenshot was attached to this order. Check the buyer&rsquo;s Venmo app directly.</p>'
          }
          <p style="margin:22px 0 6px;font-weight:700;">Confirm in one click:</p>
          <div>
            ${button(absolute(approveUrl), 'Approve & Deliver', '#1f9d55')}
            ${button(absolute(rejectUrl), 'Reject Payment', '#c0392b')}
          </div>
          <p style="margin:8px 0 0;color:${MUTED};font-size:12px;">
            Each link works once and expires in 72 hours. Prefer the
            <a href="${escapeHtml(absolute('/admin'))}" style="color:${BRAND};">admin panel</a>
            if you need to attach extra files or change the amount.
          </p>`,
      });
      return send({
        to: cfg.adminEmail,
        subject: `Payment to review — ${order.id} (${order.total})`,
        text: [
          `Order ${order.id} needs review.`,
          `Customer: ${order.buyer?.name || '-'} <${order.buyer?.email || '-'}>`,
          `Amount due: ${order.total}`,
          `Venmo handle: ${order.buyer?.handle || order.payment?.payer || '-'}`,
          `Transaction ID: ${order.payment?.transactionId || order.buyer?.transactionId || '-'}`,
          '',
          `Approve & deliver: ${absolute(approveUrl)}`,
          `Reject: ${absolute(rejectUrl)}`,
        ].join('\n'),
        html,
        attachments,
      });
    },

    /** To the buyer once the payment is accepted. */
    async buyerDelivery({ order, links = [], expiresAt = null }) {
      const list = links.length
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${links
            .map(
              (link) => `<tr><td style="padding:6px 0;">${button(
                link.href,
                `Download — ${link.label}`,
                BRAND
              )}</td></tr>`
            )
            .join('')}</table>`
        : '<p>Your files are being prepared and will arrive in a follow-up email shortly.</p>';
      const html = layout({
        title: 'Your Greyfire files are ready',
        preview: `Thanks ${order.buyer?.name || ''} — order ${order.id} is confirmed and your downloads are unlocked.`,
        body: `
          <p>Hi ${escapeHtml(order.buyer?.name || 'there')},</p>
          <p>Thanks! We confirmed your Venmo payment for order <strong>${escapeHtml(order.id)}</strong>.
             Your digital files are ready to download.</p>
          ${rows([
            ['Order ID', order.id],
            ['Amount paid', order.total],
            ['Paid via', `Venmo${order.buyer?.handle ? ` (@${order.buyer.handle})` : ''}`],
          ])}
          ${list}
          ${
            expiresAt
              ? `<p style="margin:10px 0 0;color:${MUTED};font-size:12px;">These links stay active until ${escapeHtml(
                  new Date(expiresAt).toDateString()
                )}. Reply to this email if you need a fresh link.</p>`
              : ''
          }
          <p style="margin:18px 0 0;">Keep this email — it is your receipt.</p>`,
      });
      return send({
        to: order.buyer?.email,
        subject: `Your Greyfire files are ready — ${order.id}`,
        text: [
          `Hi ${order.buyer?.name || 'there'},`,
          '',
          `We confirmed your Venmo payment for order ${order.id} (${order.total}).`,
          '',
          ...links.map((link) => `Download — ${link.label}: ${absolute(link.href)}`),
          '',
          expiresAt ? `Links stay active until ${new Date(expiresAt).toDateString()}.` : '',
          'Keep this email — it is your receipt.',
        ]
          .filter(Boolean)
          .join('\n'),
        html,
      });
    },

    async buyerRejection({ order, note = '' }) {
      const html = layout({
        title: `We could not confirm payment for ${order.id}`,
        preview: `Order ${order.id} was not verified. Reply with your Venmo receipt and we will take another look.`,
        body: `
          <p>Hi ${escapeHtml(order.buyer?.name || 'there')},</p>
          <p>We were not able to confirm the Venmo payment for order <strong>${escapeHtml(order.id)}</strong>
             (${escapeHtml(order.total)}).</p>
          ${note ? `<blockquote style="margin:16px 0;padding:12px 14px;background:#faf8f6;border-left:3px solid ${BRAND};color:${INK};">${escapeHtml(note)}</blockquote>` : ''}
          <p style="margin:16px 0 0;">Just reply to this email with your Venmo receipt (screenshot or transaction ID)
             and we will re-check it — usually within a day.</p>`,
      });
      return send({
        to: order.buyer?.email,
        subject: `Action needed — order ${order.id}`,
        text: [
          `Hi ${order.buyer?.name || 'there'},`,
          '',
          `We could not confirm the Venmo payment for order ${order.id} (${order.total}).`,
          note ? `\n${note}\n` : '',
          'Reply with your Venmo receipt (screenshot or transaction ID) and we will re-check it.',
        ].join('\n'),
        html,
      });
    },
  };
}
