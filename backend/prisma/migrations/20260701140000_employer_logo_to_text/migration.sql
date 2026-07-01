-- Widen employer_profiles.logoUrl to hold base64 data URLs. VarChar(512)
-- only fits a short CDN link; the Post-Job wizard ships the whole PNG as
-- a data URL (~40KB), which was 500ing on PATCH /employer/profile with
-- Prisma P2000 (value too long).
ALTER TABLE "employer_profiles" ALTER COLUMN "logoUrl" TYPE TEXT;
