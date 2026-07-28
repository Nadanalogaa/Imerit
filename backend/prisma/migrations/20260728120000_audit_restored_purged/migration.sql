-- Add USER_RESTORED and USER_PURGED to AuditAction enum for the trash flow.
-- Positioned after USER_DELETED so the enum ordering matches the schema.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'USER_RESTORED' AFTER 'USER_DELETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'USER_PURGED' AFTER 'USER_RESTORED';
