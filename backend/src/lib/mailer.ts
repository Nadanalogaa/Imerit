import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

/**
 * Central outbound-email helper. Every place that needs to send email
 * calls `sendEmail()` — never nodemailer directly — so we can swap the
 * transport (Zoho → ZeptoMail → SES, whatever) by touching only this
 * file + a handful of env vars.
 *
 * Design:
 *   - If SMTP_HOST is blank the transport is a "log-only" stub that
 *     writes each attempt to the logger and returns success. Keeps
 *     dev happy without needing a mailbox; keeps prod safe if the
 *     credentials aren't wired yet — we don't want the API to 500
 *     on every signup just because email is misconfigured.
 *   - The real transport is a singleton — created once at boot,
 *     reused for every send. Nodemailer's connection pool handles
 *     the underlying keep-alives.
 *   - Every send is fire-and-forget from the caller's perspective:
 *     failures log at `error` but never throw. Email is a side-effect
 *     of user actions and must never block the happy path (e.g. a
 *     candidate applying to a job shouldn't get a 500 because Zoho
 *     rate-limited us for 30 seconds).
 */

type SendArgs = {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  /** Plain-text alternative — auto-derived from html if omitted. */
  text?: string;
  /** Reply-To header. Useful for admin-cc'd notifications so replies
   *  land in the sender's inbox, not the noreply mailbox. */
  replyTo?: string;
};

let cachedTransporter: Transporter | null = null;

function makeTransport(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn(
      { smtpConfigured: false },
      "SMTP not configured — emails will be logged, not sent. Set SMTP_HOST/USER/PASS in .env to enable.",
    );
    return null;
  }
  const t = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // Port 465 uses implicit TLS ("secure"), everything else (587, 2525)
    // upgrades via STARTTLS. Zoho, Brevo, and M365 all use 587 + STARTTLS.
    secure: env.SMTP_PORT === 465,
    requireTLS: env.SMTP_PORT !== 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    // Keep the socket warm between sends so a burst of signups doesn't
    // pay the TLS handshake cost per email.
    pool: true,
    maxConnections: 3,
  });
  logger.info(
    { host: env.SMTP_HOST, port: env.SMTP_PORT, user: env.SMTP_USER },
    "SMTP transport ready",
  );
  return t;
}

function getTransport(): Transporter | null {
  if (cachedTransporter !== null) return cachedTransporter;
  cachedTransporter = makeTransport();
  return cachedTransporter;
}

/**
 * Send an email. Never throws — logs failures so a broken SMTP relay
 * can't take the API down. Callers should treat this as fire-and-forget.
 */
export async function sendEmail(args: SendArgs): Promise<void> {
  const to = Array.isArray(args.to) ? args.to.join(", ") : args.to;
  const cc = args.cc ? (Array.isArray(args.cc) ? args.cc.join(", ") : args.cc) : undefined;
  const bcc = args.bcc ? (Array.isArray(args.bcc) ? args.bcc.join(", ") : args.bcc) : undefined;
  const from = env.SMTP_FROM || (env.SMTP_USER ? `i-Tamil Recruit <${env.SMTP_USER}>` : "i-Tamil Recruit <noreply@itamilrecruit.net>");

  const transport = getTransport();
  if (!transport) {
    // Dev / mis-configured prod: just log so we can see what WOULD be sent.
    logger.info({ to, cc, subject: args.subject, dev: true }, "EMAIL (log-only — SMTP not configured)");
    return;
  }

  try {
    const info = await transport.sendMail({
      from,
      to,
      cc,
      bcc,
      replyTo: args.replyTo,
      subject: args.subject,
      html: args.html,
      // Nodemailer will auto-derive text from html if we don't pass one,
      // but a hand-rolled plain-text version reads better in dumb clients.
      text: args.text ?? htmlToPlain(args.html),
    });
    logger.info({ to, subject: args.subject, messageId: info.messageId }, "email sent");
  } catch (err) {
    logger.error({ err, to, subject: args.subject }, "email send failed");
    // Deliberately do NOT rethrow — the caller (a signup / job-post
    // handler) shouldn't 500 because the mail relay had a hiccup.
  }
}

/** Quick-and-dirty HTML → text. Good enough for the plain-text alt part. */
function htmlToPlain(html: string): string {
  return html
    .replace(/<\/(p|div|h[1-6]|li|br|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
