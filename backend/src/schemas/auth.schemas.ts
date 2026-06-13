import { z } from "zod";
import { OtpPurpose, UserRole } from "@prisma/client";

/**
 * Zod schemas for the auth endpoints — these are the single source of truth
 * for what the API will accept. The `validate()` middleware uses them to
 * reject malformed input with a 422 before any handler runs.
 */

// Indian mobile — optional at register; structured profile collects it later.
const indianMobile = z
  .string()
  .regex(/^[6-9]\d{9}$/u, "Enter a valid 10-digit Indian mobile")
  .optional();

const otpCode = z.string().regex(/^\d{6}$/u, "OTP must be 6 digits");

// We never let user input pick ADMIN / SUPER_ADMIN — those roles are seeded.
const publicRole = z.enum([UserRole.CANDIDATE, UserRole.EMPLOYER]);

export const registerSchema = z.object({
  role: publicRole,
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email(),
  mobile: indianMobile,
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
});

export const otpVerifySchema = z.object({
  email: z.string().trim().email(),
  code: otpCode,
  purpose: z.enum([OtpPurpose.REGISTER, OtpPurpose.LOGIN]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
