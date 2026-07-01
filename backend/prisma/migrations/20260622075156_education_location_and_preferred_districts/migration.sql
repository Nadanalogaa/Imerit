-- AlterTable
ALTER TABLE "candidate_profiles" ADD COLUMN     "preferredDistricts" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "education" ADD COLUMN     "districtId" TEXT,
ADD COLUMN     "pincode" TEXT;
