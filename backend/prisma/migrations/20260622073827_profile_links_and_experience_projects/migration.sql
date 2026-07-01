-- AlterTable
ALTER TABLE "candidate_profiles" ADD COLUMN     "links" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "experience_projects" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "showcaseUrl" VARCHAR(512),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experience_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "experience_projects_experienceId_idx" ON "experience_projects"("experienceId");

-- AddForeignKey
ALTER TABLE "experience_projects" ADD CONSTRAINT "experience_projects_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
