import { env } from "../config/env.js";

/**
 * HTML email templates for every user-facing notification. Each template
 * is a pure function of its input data — no DB access, no side effects
 * — so they're trivial to snapshot-test and preview locally.
 *
 * Design:
 *   - One base shell (`shell()`) wraps every template so the header,
 *     footer, brand tone, and layout stay identical across event types.
 *     Edit shell() once → every email changes.
 *   - Inline CSS only. Gmail/Outlook strip <style> and <link>; inline
 *     is the only reliable approach for HTML email.
 *   - Table layout for the outer structure. Modern email clients tolerate
 *     flex/grid but the old ones (Outlook 2016 desktop, some webmail)
 *     still choke. Tables are boring but bulletproof.
 *   - Colors match the app's brand orange (#f97316 / brand-500 in Tailwind).
 */

const BRAND_ORANGE = "#f97316";
const BRAND_ORANGE_DARK = "#c2410c";
const BG_SOFT = "#fafafa";
const TEXT_MAIN = "#18181b";
const TEXT_MUTED = "#71717a";
const BORDER_SOFT = "#e4e4e7";

/**
 * Common wrapper — header + body + footer. Every template feeds its
 * body HTML into `body`; the shell handles the rest.
 */
function shell(opts: {
  title: string;
  preheader?: string; // hidden preview text shown in inbox listing
  body: string;
}): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(opts.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BG_SOFT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:${TEXT_MAIN};">
    ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${BG_SOFT};">${escapeHtml(opts.preheader)}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_SOFT};padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <!-- Header -->
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid ${BORDER_SOFT};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <a href="${env.PUBLIC_APP_URL}" style="text-decoration:none;color:${BRAND_ORANGE};font-size:20px;font-weight:700;letter-spacing:-0.01em;">
                        i-Tamil Recruit
                      </a>
                      <div style="font-size:11px;color:${TEXT_MUTED};letter-spacing:0.08em;text-transform:uppercase;margin-top:2px;">Job Portal for Skilled Talent</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                ${opts.body}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 32px;background:${BG_SOFT};border-top:1px solid ${BORDER_SOFT};font-size:12px;color:${TEXT_MUTED};line-height:1.5;">
                <p style="margin:0 0 6px;">Rudraa HR Solutions Pvt. Ltd. · Tamil Nadu, India</p>
                <p style="margin:0;">
                  You're receiving this because you have an account on i-Tamil Recruit.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function primaryButton(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;padding:12px 22px;background:${BRAND_ORANGE};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">${escapeHtml(label)}</a>`;
}

function codeChip(code: string): string {
  return `<div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:28px;font-weight:700;letter-spacing:0.24em;background:${BG_SOFT};border:1px solid ${BORDER_SOFT};border-radius:12px;padding:16px 24px;text-align:center;color:${TEXT_MAIN};margin:16px 0;">${escapeHtml(code)}</div>`;
}

function credentialTable(email: string, password: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid ${BORDER_SOFT};border-radius:12px;background:${BG_SOFT};margin:16px 0;">
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid ${BORDER_SOFT};font-size:12px;color:${TEXT_MUTED};letter-spacing:0.06em;text-transform:uppercase;">Email</td>
      <td style="padding:12px 16px;border-bottom:1px solid ${BORDER_SOFT};font-family:'SF Mono',Menlo,Consolas,monospace;font-size:14px;color:${TEXT_MAIN};">${escapeHtml(email)}</td>
    </tr>
    <tr>
      <td style="padding:12px 16px;font-size:12px;color:${TEXT_MUTED};letter-spacing:0.06em;text-transform:uppercase;">Password</td>
      <td style="padding:12px 16px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:14px;color:${TEXT_MAIN};">${escapeHtml(password)}</td>
    </tr>
  </table>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// =====================================================================
// Templates — one per notification type
// =====================================================================

/**
 * OTP for register / login / password-reset. The `purpose` label tunes
 * the subject line and body copy for each flow so recipients aren't
 * confused when they get the same-looking email in a different context.
 */
export function otpEmail(args: {
  purpose: "register" | "login" | "reset";
  code: string;
  expiresInMin: number;
}): { subject: string; html: string } {
  const purposeCopy = {
    register: {
      heading: "Confirm your email",
      body: "Welcome to i-Tamil Recruit. Enter this code to finish creating your account.",
      subject: "Verify your email · i-Tamil Recruit",
    },
    login: {
      heading: "Your sign-in code",
      body: "Enter this code in the app to sign in.",
      subject: "Your sign-in code · i-Tamil Recruit",
    },
    reset: {
      heading: "Reset your password",
      body: "Use this code to set a new password. If you didn't ask to reset your password, ignore this email — your account is safe.",
      subject: "Password reset code · i-Tamil Recruit",
    },
  }[args.purpose];

  return {
    subject: purposeCopy.subject,
    html: shell({
      title: purposeCopy.heading,
      preheader: `${args.code} — expires in ${args.expiresInMin} minutes`,
      body: `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:${TEXT_MAIN};">${purposeCopy.heading}</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${TEXT_MUTED};">${purposeCopy.body}</p>
        ${codeChip(args.code)}
        <p style="margin:16px 0 0;font-size:13px;color:${TEXT_MUTED};">This code expires in <strong>${args.expiresInMin} minutes</strong>. Do not share it with anyone.</p>
      `,
    }),
  };
}

/**
 * Welcome email fired after register verification succeeds. Includes
 * a CTA back into the app to nudge profile completion.
 */
export function welcomeEmail(args: {
  name: string;
  role: "candidate" | "employer";
}): { subject: string; html: string } {
  const rolePath = args.role === "candidate" ? "/candidate/dashboard" : "/employer/dashboard";
  const roleLine =
    args.role === "candidate"
      ? "Complete your profile so employers can find you and start browsing jobs near you."
      : "Post your first job and reach candidates across Tamil Nadu and Puducherry.";

  return {
    subject: `Welcome to i-Tamil Recruit, ${args.name}!`,
    html: shell({
      title: "Welcome to i-Tamil Recruit",
      preheader: roleLine,
      body: `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;">Welcome, ${escapeHtml(args.name)}!</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${TEXT_MUTED};">${roleLine}</p>
        <p style="margin:24px 0;">${primaryButton(args.role === "candidate" ? "Complete your profile" : "Post your first job", `${env.PUBLIC_APP_URL}${rolePath}`)}</p>
      `,
    }),
  };
}

/**
 * Sent to staff (or staff-provisioned employer) when the account is
 * created and again on every password reset. Includes the plain-text
 * credentials — we generate the password server-side and this is
 * the only time the user sees it in their own inbox.
 */
export function credentialsEmail(args: {
  name: string;
  email: string;
  password: string;
  role: "staff" | "employer";
  event: "created" | "reset";
}): { subject: string; html: string } {
  const loginPath = args.role === "staff" ? "/staff/login" : "/employer/login";
  const heading = args.event === "created"
    ? `Your i-Tamil Recruit ${args.role === "staff" ? "staff" : "employer"} account is ready`
    : "Your password has been reset";
  const intro = args.event === "created"
    ? `An account has been created for you on i-Tamil Recruit as ${args.role === "staff" ? "a staff member" : "an employer"}. Sign in with the credentials below and change your password on first login.`
    : `Your password has been reset by an administrator. Sign in with the new credentials below.`;

  return {
    subject: heading,
    html: shell({
      title: heading,
      preheader: `Sign in at ${env.PUBLIC_APP_URL}${loginPath}`,
      body: `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;">${escapeHtml(heading)}</h1>
        <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${TEXT_MUTED};">Hi ${escapeHtml(args.name)},</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${TEXT_MUTED};">${intro}</p>
        ${credentialTable(args.email, args.password)}
        <p style="margin:24px 0;">${primaryButton("Sign in", `${env.PUBLIC_APP_URL}${loginPath}`)}</p>
        <p style="margin:16px 0 0;font-size:12px;color:${TEXT_MUTED};">Keep this email safe — the password is only shown here once. If you didn't expect this account, contact <a href="mailto:hello@itamilrecruit.net" style="color:${BRAND_ORANGE};">hello@itamilrecruit.net</a>.</p>
      `,
    }),
  };
}

/**
 * Fires when a candidate applies. Three recipients get slightly different
 * copy — this is the CANDIDATE version.
 */
export function applicationCandidateEmail(args: {
  candidateName: string;
  jobTitle: string;
  employerName: string;
  jobId: string;
}): { subject: string; html: string } {
  return {
    subject: `You applied to ${args.jobTitle} at ${args.employerName}`,
    html: shell({
      title: "Application submitted",
      preheader: `${args.employerName} will review your application`,
      body: `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;">Application submitted</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${TEXT_MUTED};">Hi ${escapeHtml(args.candidateName)}, your application for <strong>${escapeHtml(args.jobTitle)}</strong> at <strong>${escapeHtml(args.employerName)}</strong> has been sent. The employer will get in touch if they'd like to move forward.</p>
        <p style="margin:24px 0;">${primaryButton("View your applications", `${env.PUBLIC_APP_URL}/candidate/applications`)}</p>
      `,
    }),
  };
}

/** EMPLOYER version — "you got an application". */
export function applicationEmployerEmail(args: {
  employerName: string;
  candidateName: string;
  jobTitle: string;
  jobId: string;
}): { subject: string; html: string } {
  return {
    subject: `New applicant for ${args.jobTitle}`,
    html: shell({
      title: "New applicant",
      preheader: `${args.candidateName} applied to ${args.jobTitle}`,
      body: `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;">New applicant</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${TEXT_MUTED};">Hi ${escapeHtml(args.employerName)}, <strong>${escapeHtml(args.candidateName)}</strong> just applied to your job <strong>${escapeHtml(args.jobTitle)}</strong>. Review the profile and reach out from your applicant dashboard.</p>
        <p style="margin:24px 0;">${primaryButton("Review applicant", `${env.PUBLIC_APP_URL}/employer/jobs/${args.jobId}/applicants`)}</p>
      `,
    }),
  };
}

/** Profile moderation outcome — approved or rejected. */
export function moderationEmail(args: {
  name: string;
  status: "APPROVED" | "REJECTED";
  notes?: string | null;
  role: "candidate" | "employer";
}): { subject: string; html: string } {
  const approved = args.status === "APPROVED";
  const rolePath = args.role === "candidate" ? "/candidate/dashboard" : "/employer/dashboard";
  return {
    subject: approved ? "Your profile was approved" : "Your profile needs an update",
    html: shell({
      title: approved ? "Profile approved" : "Profile needs an update",
      preheader: approved ? "You're all set" : args.notes ?? "Please review the feedback and resubmit",
      body: `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;">${approved ? "Profile approved" : "Profile needs an update"}</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${TEXT_MUTED};">Hi ${escapeHtml(args.name)},</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${TEXT_MUTED};">${approved
          ? "Your profile passed moderation and is now visible on i-Tamil Recruit."
          : "Our team reviewed your profile and it needs a few changes before it can go live."}</p>
        ${args.notes ? `<div style="border-left:3px solid ${BRAND_ORANGE};padding:12px 16px;background:${BG_SOFT};border-radius:8px;font-size:13px;color:${TEXT_MAIN};margin:16px 0;">${escapeHtml(args.notes)}</div>` : ""}
        <p style="margin:24px 0;">${primaryButton(approved ? "Go to dashboard" : "Update profile", `${env.PUBLIC_APP_URL}${rolePath}`)}</p>
      `,
    }),
  };
}

/**
 * Confirmation to the employer when a new job goes live. Also used for
 * jobs posted by staff on the employer's behalf — copy reads the same
 * either way ("your job is live").
 */
export function jobPostedEmail(args: {
  employerName: string;
  jobTitle: string;
  jobId: string;
  postedByStaff?: boolean;
}): { subject: string; html: string } {
  return {
    subject: `Your job "${args.jobTitle}" is live`,
    html: shell({
      title: "Job posted",
      preheader: `${args.jobTitle} is now visible to candidates`,
      body: `
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;">Your job is live</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${TEXT_MUTED};">Hi ${escapeHtml(args.employerName)}, <strong>${escapeHtml(args.jobTitle)}</strong> ${args.postedByStaff ? "was posted on your behalf by our staff team" : "has been posted"} and is now visible to candidates on i-Tamil Recruit. It stays live for 45 days.</p>
        <p style="margin:24px 0;">${primaryButton("View job", `${env.PUBLIC_APP_URL}/employer/jobs/${args.jobId}`)}</p>
      `,
    }),
  };
}

/**
 * Generic "activity" email cc'd to admin. Used for every meaningful
 * platform event so the ops inbox is a running log. Body is a small
 * key-value table of the fields we passed in.
 */
export function adminActivityEmail(args: {
  action: string;
  summary: string;
  fields?: Record<string, string>;
}): { subject: string; html: string } {
  const rows = Object.entries(args.fields ?? {})
    .map(([k, v]) => `<tr><td style="padding:8px 12px;font-size:12px;color:${TEXT_MUTED};letter-spacing:0.04em;text-transform:uppercase;border-bottom:1px solid ${BORDER_SOFT};">${escapeHtml(k)}</td><td style="padding:8px 12px;font-size:13px;color:${TEXT_MAIN};border-bottom:1px solid ${BORDER_SOFT};">${escapeHtml(v)}</td></tr>`)
    .join("");
  return {
    subject: `[i-Tamil ops] ${args.action}`,
    html: shell({
      title: args.action,
      preheader: args.summary,
      body: `
        <div style="display:inline-block;background:${BG_SOFT};color:${TEXT_MUTED};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;padding:4px 10px;border-radius:999px;margin-bottom:12px;">Ops activity</div>
        <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;">${escapeHtml(args.action)}</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${TEXT_MUTED};">${escapeHtml(args.summary)}</p>
        ${rows ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid ${BORDER_SOFT};border-radius:12px;overflow:hidden;margin:16px 0;">${rows}</table>` : ""}
      `,
    }),
  };
}
