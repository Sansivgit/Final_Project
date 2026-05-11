import nodemailer from 'nodemailer';

/** Gmail App Passwords are 16 chars; Google often displays them with spaces — strip all whitespace. */
export function normalizeSmtpPass() {
  const raw = process.env.SMTP_PASS;
  if (raw == null) return '';
  return String(raw).replace(/\s+/g, '').trim();
}

function createTransport() {
  const user = process.env.SMTP_USER?.trim();
  const pass = normalizeSmtpPass();
  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_PASS are required');
  }

  const host = (process.env.SMTP_HOST || '').trim().toLowerCase();

  // Use Nodemailer's built-in Gmail preset — matches Google's expectations better than raw host/port for App Passwords.
  if (host === 'smtp.gmail.com' || process.env.SMTP_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
  });
}

export const sendMail = async ({ to, subject, html, text }) => {
  const user = process.env.SMTP_USER?.trim();
  if (!process.env.SMTP_HOST || !user || !normalizeSmtpPass()) {
    console.warn('SMTP not configured; skipping email send');
    return;
  }

  const transporter = createTransport();
  // Gmail SMTP auth must match SMTP_USER; keep From aligned when possible.
  const from = process.env.SMTP_FROM?.trim() || user;

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });
};
