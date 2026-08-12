-- CandidateProfile — industry / department taxonomy + CV upload (base64).
ALTER TABLE "candidate_profiles" ADD COLUMN "industry"   VARCHAR(120);
ALTER TABLE "candidate_profiles" ADD COLUMN "department" VARCHAR(120);
ALTER TABLE "candidate_profiles" ADD COLUMN "cvUrl"      TEXT;
ALTER TABLE "candidate_profiles" ADD COLUMN "cvFileName" VARCHAR(255);

CREATE INDEX "candidate_profiles_industry_department_idx"
  ON "candidate_profiles" ("industry", "department");

-- Job — department dropdown next to industry in the wizard.
ALTER TABLE "jobs" ADD COLUMN "department" VARCHAR(120);

-- Standalone / personal projects on the candidate profile (freshers +
-- experienced can add). Distinct from experience_projects which are
-- role-scoped.
CREATE TABLE "candidate_projects" (
  "id"          TEXT NOT NULL,
  "profileId"   TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "skills"      JSONB NOT NULL DEFAULT '[]',
  "role"        VARCHAR(120),
  "showcaseUrl" VARCHAR(512),
  "startedAt"   VARCHAR(10),
  "endedAt"     VARCHAR(10),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "candidate_projects_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "candidate_projects_profileId_idx"
  ON "candidate_projects" ("profileId");
ALTER TABLE "candidate_projects"
  ADD CONSTRAINT "candidate_projects_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Certifications (Coursera, AWS, GATE, PMP, etc.). Optional expiry so the
-- resume can flag time-bound credentials as current / lapsed.
CREATE TABLE "certifications" (
  "id"            TEXT NOT NULL,
  "profileId"     TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "issuer"        VARCHAR(200),
  "issuedYear"    INT,
  "expiryYear"    INT,
  "credentialId"  VARCHAR(160),
  "credentialUrl" VARCHAR(512),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "certifications_profileId_idx"
  ON "certifications" ("profileId");
ALTER TABLE "certifications"
  ADD CONSTRAINT "certifications_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
