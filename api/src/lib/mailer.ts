import nodemailer from 'nodemailer';
import { env } from './env.js';
import { logger } from './logger.js';

// ─────────────────────────────────────────────────────────────
//  TRANSACTIONAL MAIL — credential emails and similar one-offs.
//
//  Email is strictly an enhancement here: every credential is also
//  shown once in the admin UI, so a missing/failing SMTP server must
//  never fail the API call that triggered the mail. All sends are
//  fire-and-forget with logged errors.
//
//  With SMTP_HOST unset, sending is disabled entirely (logged once).
// ─────────────────────────────────────────────────────────────

const transporter = env.smtpHost
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      ...(env.smtpUser ? { auth: { user: env.smtpUser, pass: env.smtpPass } } : {}),
    })
  : null;

if (!transporter) {
  logger.info('SMTP_HOST not set — transactional email is disabled');
}

export function isMailerConfigured(): boolean {
  return transporter !== null;
}

/** Fire-and-forget send. Never throws. */
export function sendMail(to: string, subject: string, html: string, text: string): void {
  if (!transporter) return;
  void transporter
    .sendMail({ from: env.smtpFrom, to, subject, html, text })
    .then(() => logger.info({ to, subject }, 'Email sent'))
    .catch((err) => logger.warn({ err, to, subject }, 'Failed to send email'));
}

// ─────────────────────────────────────────────────────────────
//  Templates
// ─────────────────────────────────────────────────────────────

interface SchoolAdminWelcomeParams {
  to: string;
  fullName: string;
  schoolName: string;
  schoolCode: string;
  email: string;
  password: string;
}

/** Branded welcome mail for a newly created School Admin account. */
export function sendSchoolAdminWelcomeEmail(params: SchoolAdminWelcomeParams): void {
  const loginUrl = `${env.appUrl}/#/login`;

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#ffffff;border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;font-size:20px;font-weight:800;color:#4f46e5;font-family:Arial,sans-serif;">E</td>
                  <td style="padding-left:12px;color:#ffffff;font-size:20px;font-weight:700;">EduAI</td>
                </tr>
              </table>
              <p style="color:#c7d2fe;font-size:13px;margin:16px 0 0;">School Administration Portal</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Welcome aboard, ${params.fullName}!</h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">
                Your administrator account for <strong>${params.schoolName}</strong> is ready.
                You can now set up classes, import students and teachers, and manage your school on EduAI.
              </p>

              <!-- Credentials card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">Your login credentials</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#64748b;width:110px;">Email</td>
                        <td style="padding:4px 0;font-size:14px;color:#0f172a;font-family:'Courier New',monospace;font-weight:600;">${params.email}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#64748b;">Password</td>
                        <td style="padding:4px 0;font-size:14px;color:#0f172a;font-family:'Courier New',monospace;font-weight:600;">${params.password}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#64748b;">School code</td>
                        <td style="padding:4px 0;font-size:14px;color:#0f172a;font-family:'Courier New',monospace;font-weight:600;">${params.schoolCode}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 36px;border-radius:10px;">
                      Sign in to your portal
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">
                🔒 For security, please change this password after your first sign-in.
                Never share your credentials — the EduAI team will never ask for your password.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                This email was sent because an EduAI administrator account was created with this address.
                If this wasn't expected, please contact your EduAI representative.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Welcome aboard, ${params.fullName}!`,
    '',
    `Your administrator account for ${params.schoolName} is ready.`,
    '',
    'Your login credentials:',
    `  Email:       ${params.email}`,
    `  Password:    ${params.password}`,
    `  School code: ${params.schoolCode}`,
    '',
    `Sign in: ${loginUrl}`,
    '',
    'For security, please change this password after your first sign-in.',
  ].join('\n');

  sendMail(params.to, `Your EduAI admin account for ${params.schoolName}`, html, text);
}
