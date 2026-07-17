import bcrypt from "bcryptjs";
import { AuditAction, Prisma, UserRole } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";
import { logger } from "../lib/logger.js";
import {
  notifyEmployerCreatedByStaff,
  notifyPasswordReset,
  notifyStaffCreated,
} from "./notify.service.js";

/**
 * Staff module — server-side companion to the localStorage-first flow we
 * shipped first. Handles:
 *   - Super-admin CRUD on staff accounts (create / list / reset password
 *     / set specific password / activate–deactivate).
 *   - Staff CRUD on the employers they provision (create / edit /
 *     reset password / list).
 *   - Staff posting jobs on behalf of a chosen employer.
 *
 * Auth model: staff has a real DB row with role=STAFF and a bcrypt
 * passwordHash used by /auth/staff/login. We ALSO store the plain-text
 * `sharedPassword` because super-admin and staff need to eyeball and
 * copy the credential to hand it off — a security tradeoff explicitly
 * requested by the product (staff isn't email-verified so we can't
 * bounce them through OTP recovery).
 */

// ------------------------------------------------------------------
// Password generation — 12 chars, alnum, no ambiguous glyphs (0/O, 1/l/I).
// Matches the frontend generator so the two sides feel consistent.
// ------------------------------------------------------------------
const PWD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
function generatePassword(len = 12): string {
  let out = "";
  for (let i = 0; i < len; i++) out += PWD_ALPHABET[Math.floor(Math.random() * PWD_ALPHABET.length)];
  return out;
}

/** Bcrypt cost — 10 is standard, quick enough on the t4g.small. */
const BCRYPT_ROUNDS = 10;

// ==================================================================
// Super-admin — manage staff accounts
// ==================================================================

interface CreateStaffArgs {
  actorId: string;
  actorRole: UserRole;
  email: string;
  name: string;
  mobile?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Create a staff user. Returns the fresh account + the plain-text
 * password (shown once to super-admin for hand-off). The password is
 * both hashed (for login) and stored in `sharedPassword` (for reveal).
 */
export async function createStaff(args: CreateStaffArgs) {
  const email = args.email.toLowerCase().trim();
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, "A user with that email already exists", "EMAIL_TAKEN");
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        name: args.name.trim(),
        mobile: args.mobile?.trim() || null,
        role: UserRole.STAFF,
        emailVerified: true,
        passwordHash,
        sharedPassword: password,
      },
      select: staffSelect,
    });
    await tx.auditLog.create({
      data: {
        actorId: args.actorId,
        actorRole: args.actorRole,
        action: AuditAction.USER_CREATED,
        targetType: "user",
        targetId: created.id,
        payload: { role: UserRole.STAFF, email: created.email, name: created.name } as Prisma.InputJsonValue,
        ip: args.ip,
        userAgent: args.userAgent?.slice(0, 512),
      },
    });
    return { user: created, password };
  });
}

/**
 * Convenience wrapper: creates the staff row AND fires the credentials
 * email + admin cc. Route handlers call this so they don't need to
 * remember the notify step. Keeps the raw `createStaff` above as a
 * unit-testable primitive with no side effects.
 */
export async function createStaffAndNotify(args: CreateStaffArgs & { actorEmail?: string }) {
  const result = await createStaff(args);
  void notifyStaffCreated({
    name: result.user.name,
    email: result.user.email,
    password: result.password,
    createdByEmail: args.actorEmail,
  }).catch((err) => logger.warn({ err }, "notifyStaffCreated failed"));
  return result;
}

export async function listStaff() {
  return prisma.user.findMany({
    where: { role: UserRole.STAFF, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: staffSelect,
  });
}

interface ResetPasswordArgs {
  actorId: string;
  actorRole: UserRole;
  staffId: string;
  ip?: string;
  userAgent?: string;
}

/** Regenerate + hash a fresh password. Returns the new plain-text so the
 *  caller can pop the CredentialShareModal. Also emails the staff user
 *  the new credentials and cc's the admin activity inbox. */
export async function resetStaffPassword(args: ResetPasswordArgs & { actorEmail?: string }) {
  const target = await requireStaffUser(args.staffId);
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { passwordHash, sharedPassword: password },
    select: staffSelect,
  });
  void notifyPasswordReset({
    name: updated.name,
    email: updated.email,
    password,
    role: "staff",
    resetByEmail: args.actorEmail,
  }).catch((err) => logger.warn({ err }, "notifyPasswordReset (staff) failed"));
  return { user: updated, password };
}

interface SetPasswordArgs extends ResetPasswordArgs {
  password: string;
}

/** Super-admin sets an explicit password (rather than auto-generating). */
export async function setStaffPassword(args: SetPasswordArgs) {
  if (args.password.length < 6) {
    throw new HttpError(400, "Password must be at least 6 characters", "PASSWORD_TOO_SHORT");
  }
  const target = await requireStaffUser(args.staffId);
  const passwordHash = await bcrypt.hash(args.password, BCRYPT_ROUNDS);
  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { passwordHash, sharedPassword: args.password },
    select: staffSelect,
  });
  return { user: updated };
}

interface DeactivateArgs {
  actorId: string;
  actorRole: UserRole;
  staffId: string;
  deactivated: boolean;
}

export async function setStaffDeactivated(args: DeactivateArgs) {
  const target = await requireStaffUser(args.staffId);
  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { deactivated: args.deactivated },
    select: staffSelect,
  });
  return { user: updated };
}

async function requireStaffUser(id: string) {
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u || u.deletedAt) throw new HttpError(404, "Staff user not found", "USER_NOT_FOUND");
  if (u.role !== UserRole.STAFF) throw new HttpError(400, "Target is not a staff account", "NOT_STAFF");
  return u;
}

// ==================================================================
// Staff — manage employers they've provisioned
// ==================================================================

interface CreateEmployerByStaffArgs {
  staffId: string;
  name: string;
  email: string;
  mobile?: string;
  company?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Provision a new employer on behalf of a staff user. Creates the User
 * row (role=EMPLOYER, tagged with createdByStaffId) and — if a company
 * name was provided — the accompanying EmployerProfile so the employer
 * doesn't have to fill in the company field on first login.
 */
export async function createEmployerByStaff(args: CreateEmployerByStaffArgs & { staffEmail?: string }) {
  const email = args.email.toLowerCase().trim();
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, "A user with that email already exists", "EMAIL_TAKEN");
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: args.name.trim(),
        mobile: args.mobile?.trim() || null,
        role: UserRole.EMPLOYER,
        emailVerified: true,
        passwordHash,
        sharedPassword: password,
        createdByStaffId: args.staffId,
      },
      select: employerSelect,
    });
    if (args.company?.trim()) {
      await tx.employerProfile.create({
        data: {
          userId: user.id,
          companyName: args.company.trim(),
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorId: args.staffId,
        actorRole: UserRole.STAFF,
        action: AuditAction.USER_CREATED,
        targetType: "user",
        targetId: user.id,
        payload: { role: UserRole.EMPLOYER, email: user.email, company: args.company } as Prisma.InputJsonValue,
        ip: args.ip,
        userAgent: args.userAgent?.slice(0, 512),
      },
    });
    return { user, password };
  });

  // Email the new employer their credentials + cc admin activity inbox.
  // Best-effort — a mail failure must not roll back the account creation.
  void notifyEmployerCreatedByStaff({
    name: result.user.name,
    email: result.user.email,
    password: result.password,
    company: args.company ?? null,
    staffEmail: args.staffEmail ?? "unknown-staff",
  }).catch((err) => logger.warn({ err }, "notifyEmployerCreatedByStaff failed"));

  return result;
}

interface UpdateEmployerArgs {
  staffId: string;
  employerId: string;
  patch: { name?: string; mobile?: string | null; company?: string | null };
}

export async function updateEmployerByStaff(args: UpdateEmployerArgs) {
  const target = await requireEmployerOwnedByStaff(args.staffId, args.employerId);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: target.id },
      data: {
        name: args.patch.name?.trim() ?? undefined,
        mobile: args.patch.mobile === undefined ? undefined : (args.patch.mobile?.trim() || null),
      },
      select: employerSelect,
    });
    if (args.patch.company !== undefined) {
      const company = args.patch.company?.trim() || null;
      // Upsert the profile so we can set/change the company name from the
      // staff-side edit form without requiring the employer to have logged
      // in and created their profile first.
      await tx.employerProfile.upsert({
        where: { userId: target.id },
        create: { userId: target.id, companyName: company ?? "" },
        update: { companyName: company ?? "" },
      });
    }
    return { user: updated };
  });
}

interface ResetEmployerPasswordArgs {
  staffId: string;
  employerId: string;
}

export async function resetEmployerPasswordByStaff(args: ResetEmployerPasswordArgs & { staffEmail?: string }) {
  const target = await requireEmployerOwnedByStaff(args.staffId, args.employerId);
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { passwordHash, sharedPassword: password },
    select: employerSelect,
  });
  void notifyPasswordReset({
    name: updated.name,
    email: updated.email,
    password,
    role: "employer",
    resetByEmail: args.staffEmail,
  }).catch((err) => logger.warn({ err }, "notifyPasswordReset (employer) failed"));
  return { user: updated, password };
}

/**
 * Full employer directory as seen by staff — every employer, plus a
 * `provisionedByMe` flag so the UI can badge/filter to "employers I own".
 * Staff needs to see every employer (they might post for a self-signed-up
 * one), so we don't filter by createdByStaffId.
 */
export async function listEmployersForStaff(staffId: string) {
  const rows = await prisma.user.findMany({
    where: { role: UserRole.EMPLOYER, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      ...employerSelect,
      employerProfile: { select: { companyName: true } },
    },
  });
  return rows.map((u) => ({
    ...u,
    company: u.employerProfile?.companyName ?? null,
    provisionedByMe: u.createdByStaffId === staffId,
  }));
}

async function requireEmployerOwnedByStaff(staffId: string, employerId: string) {
  const u = await prisma.user.findUnique({ where: { id: employerId } });
  if (!u || u.deletedAt) throw new HttpError(404, "Employer not found", "USER_NOT_FOUND");
  if (u.role !== UserRole.EMPLOYER) throw new HttpError(400, "Target is not an employer", "NOT_EMPLOYER");
  if (u.createdByStaffId !== staffId) {
    // Staff can only reset passwords / edit employers they themselves
    // provisioned — self-signed-up employers own their own credentials.
    throw new HttpError(403, "You didn't provision this employer", "FORBIDDEN");
  }
  return u;
}

// ==================================================================
// Selects — kept in one place so every response has the same shape.
// ==================================================================

const staffSelect = {
  id: true,
  role: true,
  name: true,
  email: true,
  mobile: true,
  sharedPassword: true,
  deactivated: true,
  createdAt: true,
  lastSeenAt: true,
} as const;

const employerSelect = {
  id: true,
  role: true,
  name: true,
  email: true,
  mobile: true,
  sharedPassword: true,
  deactivated: true,
  createdByStaffId: true,
  createdAt: true,
} as const;
