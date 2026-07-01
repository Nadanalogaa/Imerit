-- Expand JobType enum from 4 values to 8. Postgres can't remove or rename
-- enum values in place, so we create a new type, migrate rows, swap it in,
-- and drop the old one. Existing INTERNSHIP rows get promoted to the new
-- INTERNSHIP_TRAINING bucket which is its closest semantic equivalent.

BEGIN;

-- 1. Create the new enum with all 8 values.
CREATE TYPE "JobType_new" AS ENUM (
  'INTERNSHIP_TRAINING',
  'APPRENTICE',
  'FULL_TIME',
  'PART_TIME',
  'GIG_DELIVERY',
  'CONTRACT',
  'CONSULTANT',
  'FREELANCER'
);

-- 2. Drop the default (if any) before altering the column type so the
--    cast below doesn't have to reconcile a default of the old type.
ALTER TABLE "jobs" ALTER COLUMN "type" DROP DEFAULT;

-- 3. Change the column type, mapping any existing INTERNSHIP row to
--    INTERNSHIP_TRAINING. All other names are identical.
ALTER TABLE "jobs"
  ALTER COLUMN "type" TYPE "JobType_new"
  USING (
    CASE "type"::text
      WHEN 'INTERNSHIP' THEN 'INTERNSHIP_TRAINING'::"JobType_new"
      ELSE "type"::text::"JobType_new"
    END
  );

-- 4. Drop the old enum and rename the new one to take its place.
DROP TYPE "JobType";
ALTER TYPE "JobType_new" RENAME TO "JobType";

COMMIT;
