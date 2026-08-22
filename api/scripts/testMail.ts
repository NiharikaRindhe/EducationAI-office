// One-off SMTP connectivity + send test — NOT part of the app's runtime code.
// Usage: npx tsx scripts/testMail.ts you@example.com
//
// Checks the connection/auth first (nodemailer's verify(), no email sent),
// then sends one real test email so you can confirm it actually lands in
// the inbox, not just that the handshake succeeded.

import nodemailer from 'nodemailer';
import { env } from '../src/lib/env.js';

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error('Usage: npx tsx scripts/testMail.ts <recipient-email>');
    process.exit(1);
  }

  if (!env.smtpHost) {
    console.error('SMTP_HOST is not set in api/.env — nothing to test.');
    process.exit(1);
  }
  if (!env.smtpUser || !env.smtpPass) {
    console.error('SMTP_USER and/or SMTP_PASS are missing from api/.env — Zoho will reject an unauthenticated connection.');
    process.exit(1);
  }

  console.log(`Connecting to ${env.smtpHost}:${env.smtpPort} as ${env.smtpUser} ...`);

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection + authentication succeeded.');
  } catch (err) {
    console.error('❌ SMTP connection/auth failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }

  try {
    const info = await transporter.sendMail({
      from: env.smtpFrom,
      replyTo: env.smtpReplyTo || env.smtpFrom,
      to,
      subject: 'EduAI — test email',
      text: 'This is a test email confirming EduAI can send mail through Zoho SMTP.',
      html: '<p>This is a test email confirming <strong>EduAI</strong> can send mail through Zoho SMTP.</p>',
    });
    console.log(`✅ Test email sent to ${to}. Message ID: ${info.messageId}`);
  } catch (err) {
    console.error('❌ Sending the test email failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

void main();
