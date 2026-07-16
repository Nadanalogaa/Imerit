-- Add STAFF role for staff users who post jobs on behalf of employers.
-- Postgres requires enum values to be added in their own transaction, so
-- this ALTER TYPE runs in its own statement before anything that references
-- 'STAFF' as a value.
ALTER TYPE "UserRole" ADD VALUE 'STAFF';

-- Staff-related columns on the users table.
--   sharedPassword     — plain-text credential held so super-admin (for
--                        staff) and staff (for the employers they
--                        provision) can reveal and share it in the UI.
--                        passwordHash still holds the bcrypt used for
--                        actual auth. This is a deliberate tradeoff to
--                        match the current reveal-and-copy UX.
--   deactivated        — soft-disable a staff account without erasing
--                        the audit trail; login refuses when true.
--   createdByStaffId   — for employers created by staff, points back at
--                        the provisioning staff user; NULL for
--                        self-registered employers or seed accounts.
ALTER TABLE "users" ADD COLUMN "sharedPassword" TEXT;
ALTER TABLE "users" ADD COLUMN "deactivated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "createdByStaffId" TEXT;

ALTER TABLE "users"
  ADD CONSTRAINT "users_createdByStaffId_fkey"
  FOREIGN KEY ("createdByStaffId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "users_createdByStaffId_idx" ON "users"("createdByStaffId");

-- Staff-authored jobs: back-reference so we can list "jobs I posted for
-- other employers" without joining through the employer.
ALTER TABLE "jobs" ADD COLUMN "postedByStaffId" TEXT;

ALTER TABLE "jobs"
  ADD CONSTRAINT "jobs_postedByStaffId_fkey"
  FOREIGN KEY ("postedByStaffId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "jobs_postedByStaffId_idx" ON "jobs"("postedByStaffId");
