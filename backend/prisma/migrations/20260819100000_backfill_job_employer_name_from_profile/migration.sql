-- Backfill jobs.employerName from employer_profiles.companyName.
--
-- Prior to this deploy, the /employer/jobs and /staff/jobs endpoints
-- snapshotted `User.name` (the contact person) into `Job.employerName`
-- instead of the profile's companyName. Browse cards therefore showed
-- "Sathiya Narayanan" instead of "Rudraa HR Solutions" (or equivalent).
--
-- This one-shot UPDATE fixes historical rows so cards render the org.
-- Idempotent: re-running is a no-op because rows already matching the
-- companyName are updated to the same value.
--
-- We only overwrite when the profile has an explicit companyName set —
-- rows with no profile row, or with an empty/whitespace companyName,
-- are left alone (fall back to whatever's there).

UPDATE "jobs"
SET "employerName" = TRIM(ep."companyName")
FROM "employer_profiles" ep
WHERE ep."userId" = "jobs"."employerId"
  AND ep."companyName" IS NOT NULL
  AND TRIM(ep."companyName") <> ''
  AND "jobs"."deletedAt" IS NULL;
