-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "benefits" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "contactEmail" VARCHAR(254);
