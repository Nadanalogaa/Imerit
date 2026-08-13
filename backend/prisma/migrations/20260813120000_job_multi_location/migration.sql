-- Multi-location job postings. The `jobs` table keeps its own primary
-- location columns unchanged (districtId / talukId / lat / lng / pincode
-- / street / location); this table holds every ADDITIONAL location the
-- employer added in the wizard. Browse-jobs district filter matches when
-- EITHER the primary or any job_locations row is in the picked district.

CREATE TABLE "job_locations" (
  "id"          TEXT NOT NULL,
  "jobId"       TEXT NOT NULL,
  "districtId"  TEXT,
  "talukId"     TEXT,
  "lat"         DOUBLE PRECISION,
  "lng"         DOUBLE PRECISION,
  "pincode"     TEXT,
  "street"      VARCHAR(255),
  "label"       TEXT NOT NULL,
  "position"    INT  NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_locations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "job_locations_jobId_idx"      ON "job_locations" ("jobId");
CREATE INDEX "job_locations_districtId_idx" ON "job_locations" ("districtId");
ALTER TABLE "job_locations"
  ADD CONSTRAINT "job_locations_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "jobs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
