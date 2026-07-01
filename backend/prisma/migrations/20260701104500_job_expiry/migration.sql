-- Add expiresAt to every job. Existing jobs get 45 days from their
-- postedAt (not from now) so demo/historical data doesn't all snap to
-- a fresh 45-day window at once.

ALTER TABLE "jobs"
  ADD COLUMN "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (now() + interval '45 days');

UPDATE "jobs" SET "expiresAt" = "postedAt" + interval '45 days';

CREATE INDEX "jobs_expiresAt_idx" ON "jobs"("expiresAt");
