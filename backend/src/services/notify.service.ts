import { env } from "../config/env.js";
import { sendEmail } from "../lib/mailer.js";
import {
  adminActivityEmail,
  applicationCandidateEmail,
  applicationEmployerEmail,
  credentialsEmail,
  jobPostedEmail,
  moderationEmail,
  otpEmail,
  welcomeEmail,
} from "../lib/email-templates.js";

/**
 * High-level notification API. Everything that sends email through the
 * app goes through one of these functions — the callers never touch
 * mailer.ts or email-templates.ts directly.
 *
 * Every function:
 *   1. Sends the primary email(s) to the user(s) involved.
 *   2. Sends an admin-cc email to ADMIN_NOTIFICATIONS_EMAIL so ops has
 *      a running log of platform activity in one inbox.
 *   3. Never throws. sendEmail already swallows errors internally,
 *      but this layer is also fire-and-forget from the route's POV.
 *
 * Call these AFTER the DB write succeeds — a failed email should NOT
 * roll back a successful signup/apply/etc.
 */

// ---------- helpers ----------

function adminCc(): string[] {
  return env.ADMIN_NOTIFICATIONS_EMAIL;
}

async function notifyAdmins(action: string, summary: string, fields?: Record<string, string>): Promise<void> {
  const to = adminCc();
  if (to.length === 0) return; // nothing configured — skip silently
  const t = adminActivityEmail({ action, summary, fields });
  await sendEmail({ to, subject: t.subject, html: t.html });
}

// ---------- OTP + auth ----------

/**
 * Ship an OTP to the user. `purpose` tunes the subject + body so
 * recipients can tell a login code from a password-reset code at a
 * glance in their inbox.
 */
export async function notifyOtp(args: {
  to: string;
  code: string;
  purpose: "register" | "login" | "reset";
  expiresInMin: number;
}): Promise<void> {
  const t = otpEmail({ purpose: args.purpose, code: args.code, expiresInMin: args.expiresInMin });
  await sendEmail({ to: args.to, subject: t.subject, html: t.html });
}

/**
 * Welcome email + admin-cc after a candidate or employer completes
 * registration (i.e. after OTP verify, not on request).
 */
export async function notifyRegistered(args: {
  name: string;
  email: string;
  role: "candidate" | "employer";
}): Promise<void> {
  const t = welcomeEmail({ name: args.name, role: args.role });
  await sendEmail({ to: args.email, subject: t.subject, html: t.html });
  await notifyAdmins(
    args.role === "candidate" ? "New candidate signup" : "New employer signup",
    `${args.name} (${args.email}) just completed registration.`,
    { Role: args.role, Name: args.name, Email: args.email },
  );
}

// ---------- Staff module ----------

/** Fires when super-admin creates a staff account. */
export async function notifyStaffCreated(args: {
  name: string;
  email: string;
  password: string;
  createdByEmail?: string;
}): Promise<void> {
  const t = credentialsEmail({
    name: args.name,
    email: args.email,
    password: args.password,
    role: "staff",
    event: "created",
  });
  await sendEmail({ to: args.email, subject: t.subject, html: t.html });
  await notifyAdmins(
    "Staff account created",
    `${args.name} (${args.email}) was added as a staff user${args.createdByEmail ? ` by ${args.createdByEmail}` : ""}.`,
    { Name: args.name, Email: args.email, "Created by": args.createdByEmail ?? "system" },
  );
}

/** Fires when staff or super-admin resets a password (auto-generated). */
export async function notifyPasswordReset(args: {
  name: string;
  email: string;
  password: string;
  role: "staff" | "employer";
  resetByEmail?: string;
}): Promise<void> {
  const t = credentialsEmail({
    name: args.name,
    email: args.email,
    password: args.password,
    role: args.role,
    event: "reset",
  });
  await sendEmail({ to: args.email, subject: t.subject, html: t.html });
  await notifyAdmins(
    `${args.role === "staff" ? "Staff" : "Employer"} password reset`,
    `Password for ${args.name} (${args.email}) was reset${args.resetByEmail ? ` by ${args.resetByEmail}` : ""}.`,
    { Name: args.name, Email: args.email, Role: args.role, "Reset by": args.resetByEmail ?? "system" },
  );
}

/** Fires when staff creates an employer via the Employer Master. */
export async function notifyEmployerCreatedByStaff(args: {
  name: string;
  email: string;
  password: string;
  company?: string | null;
  staffEmail: string;
}): Promise<void> {
  const t = credentialsEmail({
    name: args.name,
    email: args.email,
    password: args.password,
    role: "employer",
    event: "created",
  });
  await sendEmail({ to: args.email, subject: t.subject, html: t.html });
  await notifyAdmins(
    "Employer provisioned by staff",
    `Staff ${args.staffEmail} provisioned employer ${args.name} (${args.email}).`,
    {
      Name: args.name,
      Email: args.email,
      Company: args.company ?? "—",
      "Provisioned by": args.staffEmail,
    },
  );
}

// ---------- Profile moderation ----------

export async function notifyProfileModerated(args: {
  name: string;
  email: string;
  status: "APPROVED" | "REJECTED";
  notes?: string | null;
  role: "candidate" | "employer";
  moderatorEmail?: string;
}): Promise<void> {
  const t = moderationEmail({ name: args.name, status: args.status, notes: args.notes, role: args.role });
  await sendEmail({ to: args.email, subject: t.subject, html: t.html });
  await notifyAdmins(
    `Profile ${args.status.toLowerCase()}`,
    `${args.name} (${args.email}) — ${args.role} profile ${args.status.toLowerCase()}${args.moderatorEmail ? ` by ${args.moderatorEmail}` : ""}.`,
    {
      Name: args.name,
      Email: args.email,
      Role: args.role,
      Decision: args.status,
      Notes: args.notes ?? "—",
    },
  );
}

// ---------- Jobs + applications ----------

/** Fires when an employer (or staff on their behalf) posts a new job. */
export async function notifyJobPosted(args: {
  employerName: string;
  employerEmail: string;
  jobTitle: string;
  jobId: string;
  postedByStaffEmail?: string;
}): Promise<void> {
  const t = jobPostedEmail({
    employerName: args.employerName,
    jobTitle: args.jobTitle,
    jobId: args.jobId,
    postedByStaff: !!args.postedByStaffEmail,
  });
  await sendEmail({ to: args.employerEmail, subject: t.subject, html: t.html });
  await notifyAdmins(
    "New job posted",
    `${args.jobTitle} — ${args.employerName}${args.postedByStaffEmail ? ` (posted by staff ${args.postedByStaffEmail})` : ""}.`,
    {
      Job: args.jobTitle,
      Employer: args.employerName,
      "Posted by": args.postedByStaffEmail ?? "employer (self)",
      "Job ID": args.jobId,
    },
  );
}

/**
 * Fires when a candidate applies to a job. Sends TWO user-facing
 * emails (candidate confirmation, employer alert) plus the admin cc.
 */
export async function notifyApplication(args: {
  candidateName: string;
  candidateEmail: string;
  employerName: string;
  employerEmail: string;
  jobTitle: string;
  jobId: string;
}): Promise<void> {
  const candidateTpl = applicationCandidateEmail({
    candidateName: args.candidateName,
    jobTitle: args.jobTitle,
    employerName: args.employerName,
    jobId: args.jobId,
  });
  await sendEmail({ to: args.candidateEmail, subject: candidateTpl.subject, html: candidateTpl.html });

  const employerTpl = applicationEmployerEmail({
    employerName: args.employerName,
    candidateName: args.candidateName,
    jobTitle: args.jobTitle,
    jobId: args.jobId,
  });
  await sendEmail({ to: args.employerEmail, subject: employerTpl.subject, html: employerTpl.html });

  await notifyAdmins(
    "New application",
    `${args.candidateName} applied to ${args.jobTitle} at ${args.employerName}.`,
    {
      Candidate: `${args.candidateName} (${args.candidateEmail})`,
      Employer: `${args.employerName} (${args.employerEmail})`,
      Job: args.jobTitle,
      "Job ID": args.jobId,
    },
  );
}
