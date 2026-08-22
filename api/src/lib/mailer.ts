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
    .sendMail({ from: env.smtpFrom, replyTo: env.smtpReplyTo || env.smtpFrom, to, subject, html, text })
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
            <td style="background-color:#0f172a;padding:32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#ffffff;border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;font-size:20px;font-weight:800;color:#0f172a;font-family:Arial,sans-serif;">E</td>
                  <td style="padding-left:12px;color:#ffffff;font-size:20px;font-weight:700;">EduAI</td>
                </tr>
              </table>
              <p style="color:#94a3b8;font-size:13px;margin:16px 0 0;">School Administration Portal</p>
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
                    <a href="${loginUrl}" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 36px;border-radius:10px;">
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

interface TicketRaisedParams {
  to: string;
  ticketId: string;
  subject: string;
  body: string;
  category: string;
  priority: string;
  raisedByName: string;
  raisedByRole: string;
  schoolName: string | null;
  schoolCode: string | null;
}

const PRIORITY_COLOURS: Record<string, string> = {
  urgent: '#dc2626',
  high: '#ea580c',
  normal: '#0284c7',
  low: '#64748b',
};

/**
 * Tells the Super Admin a school has raised a support ticket.
 *
 * The inbox is only checked when someone thinks to check it, so a school
 * reporting an outage could sit unread for a day. The mail carries enough of
 * the ticket to triage without signing in, and deep-links to the scoped queue.
 */
export function sendTicketRaisedEmail(params: TicketRaisedParams): void {
  const ticketUrl = `${env.appUrl}/#/super-admin/tickets`;
  const accent = PRIORITY_COLOURS[params.priority] ?? PRIORITY_COLOURS.normal;
  const origin = params.schoolName
    ? `${params.schoolName}${params.schoolCode ? ` (${params.schoolCode})` : ''}`
    : 'EduAI platform';
  // Long tickets are truncated: this mail is a triage prompt, not the record.
  const excerpt = params.body.length > 600 ? `${params.body.slice(0, 600)}…` : params.body;
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
          <tr>
            <td style="background-color:#0f172a;padding:24px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#ffffff;border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;font-size:18px;font-weight:800;color:#0f172a;font-family:Arial,sans-serif;">E</td>
                  <td style="padding-left:12px;color:#ffffff;font-size:18px;font-weight:700;">EduAI Support</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                <tr>
                  <td style="background-color:${accent};border-radius:6px;padding:4px 10px;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">${escape(params.priority)}</td>
                  <td style="padding-left:8px;font-size:12px;color:#64748b;text-transform:capitalize;">${escape(params.category)}</td>
                </tr>
              </table>

              <h1 style="margin:0 0 6px;font-size:19px;color:#0f172a;">${escape(params.subject)}</h1>
              <p style="margin:0 0 22px;font-size:13px;color:#64748b;">
                Raised by <strong style="color:#334155;">${escape(params.raisedByName)}</strong>
                (${escape(params.raisedByRole.replace('_', ' '))}) · ${escape(origin)}
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td style="padding:18px 22px;font-size:13.5px;line-height:1.65;color:#334155;white-space:pre-wrap;">${escape(excerpt)}</td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:26px 0 0;">
                <tr>
                  <td align="center">
                    <a href="${ticketUrl}" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 36px;border-radius:10px;">
                      Open the support inbox
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                You receive this because you are an EduAI Super Admin. Ticket reference
                <span style="font-family:'Courier New',monospace;">${escape(params.ticketId)}</span>.
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
    `New ${params.priority} support ticket — ${params.subject}`,
    '',
    `From:     ${params.raisedByName} (${params.raisedByRole.replace('_', ' ')})`,
    `School:   ${origin}`,
    `Category: ${params.category}`,
    '',
    excerpt,
    '',
    `Open the inbox: ${ticketUrl}`,
    `Ticket reference: ${params.ticketId}`,
  ].join('\n');

  sendMail(params.to, `[${params.priority.toUpperCase()}] ${origin}: ${params.subject}`, html, text);
}
