import EmailTemplate from '../models/EmailTemplate.js';

const DEFAULT_PASSWORD_RESET = {
  key: 'password_reset',
  subject: 'Reset your {{appName}} password',
  htmlBody: `<p>Hi {{userName}},</p>
<p>Click the button below to reset your password.</p>
<p style="margin:24px 0"><a href="{{resetUrl}}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Reset password</a></p>
<p style="font-size:13px;color:#666">If the button does not work, copy this link into your browser:<br/><a href="{{resetUrl}}">{{resetUrl}}</a></p>
<p style="font-size:13px;color:#666">This link expires in 1 hour.</p>
<p>— {{appName}}</p>`,
  textBody: `Hi {{userName}},

Reset your password by opening this link (expires in 1 hour):
{{resetUrl}}

— {{appName}}`,
};

export async function ensureEmailTemplates() {
  try {
    const exists = await EmailTemplate.findOne({ key: 'password_reset' });
    if (exists) return;
    await EmailTemplate.create(DEFAULT_PASSWORD_RESET);
    console.log('Seeded default password_reset email template');
  } catch (e) {
    console.error('ensureEmailTemplates:', e.message);
  }
}
