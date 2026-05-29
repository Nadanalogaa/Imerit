// Simple OTP utility for the prototype.
// Generates a 6-digit code, stores it in sessionStorage with a 10-min expiry,
// and returns it so the UI can display it on-screen ("Demo OTP: 123456").
// Replace with a real email-send call when the backend lands.

import { get, set, remove } from "./storage";

interface OtpRecord {
  code: string;
  expiresAt: string;
}

const KEY = (email: string) => `itr.otp.${email.toLowerCase()}`;

export function generateOtp(email: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const record: OtpRecord = {
    code,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };
  set(KEY(email), record, "session");
  return code;
}

export function verifyOtp(email: string, code: string): boolean {
  const record = get<OtpRecord | null>(KEY(email), null, "session");
  if (!record) return false;
  if (new Date(record.expiresAt) < new Date()) {
    remove(KEY(email), "session");
    return false;
  }
  if (record.code !== code) return false;
  remove(KEY(email), "session");
  return true;
}

export function getActiveOtp(email: string): string | null {
  const record = get<OtpRecord | null>(KEY(email), null, "session");
  if (!record) return null;
  if (new Date(record.expiresAt) < new Date()) return null;
  return record.code;
}
