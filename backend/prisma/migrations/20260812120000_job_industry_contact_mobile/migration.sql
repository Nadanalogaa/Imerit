-- Add optional per-job industry tag + hiring-contact mobile phone.
-- Both nullable so existing rows keep working; the wizard prompts for
-- them on new posts (industry optional, contactMobile required by the
-- UI validator but backwards-compatible at the schema layer).
--
-- Table is `jobs` (@@map on model Job) with camelCase columns.

ALTER TABLE "jobs" ADD COLUMN "contactMobile" VARCHAR(20);
ALTER TABLE "jobs" ADD COLUMN "industry"      VARCHAR(120);
