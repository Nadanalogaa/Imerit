import "dotenv/config";
import { z } from "zod";

/**
 * Single source of truth for runtime configuration.
 *
 * Every env var the app reads must appear here. If a required var is missing
 * the process exits at startup with a clear error — better to fail loud than
 * crash later in a request handler with `undefined`.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  JWT_ACCESS_TTL_MIN: z.coerce.number().int().positive().default(15),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),

  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((s) => s.split(",").map((o) => o.trim()).filter(Boolean)),

  OTP_PROVIDER: z.string().optional().default(""),
  OTP_TTL_MIN: z.coerce.number().int().positive().default(10),

  /**
   * TEST ONLY — when "true", the API echoes the plaintext OTP code in the
   * register/login response body. Convenient for curl/Postman demos before
   * a real mail provider is wired up. MUST be unset before production launch.
   */
  ENABLE_DEV_OTP: z
    .string()
    .default("false")
    .transform((s) => s === "true"),

  COOKIE_SECURE: z
    .string()
    .default("false")
    .transform((s) => s === "true"),

  /**
   * SMTP relay — nodemailer talks to whatever provider you plug in
   * (Zoho Mail, Brevo, M365, SES with SMTP interface, etc.). Leave
   * SMTP_HOST blank in dev and the mailer will log-only so you can
   * develop offline. In prod, all four fields are required.
   */
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().optional().default(""),

  /**
   * Every "we did X" notification (new signup, new job, new application,
   * moderation action, etc.) also gets cc'd here so ops can watch
   * platform activity in one inbox. Comma-separated list allowed —
   * add multiple to cc a whole team.
   */
  ADMIN_NOTIFICATIONS_EMAIL: z
    .string()
    .default("")
    .transform((s) => s.split(",").map((o) => o.trim()).filter(Boolean)),

  /**
   * Public origin — used to build absolute URLs in outbound emails
   * (login links, "View job" CTAs). Defaults to prod.
   */
  PUBLIC_APP_URL: z.string().default("https://itamilrecruit.net"),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
