-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CANDIDATE', 'EMPLOYER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('REGISTER', 'LOGIN', 'EMAIL_VERIFY', 'MOBILE_VERIFY', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "CandidateType" AS ENUM ('FRESHER', 'EXPERIENCED');

-- CreateEnum
CREATE TYPE "FieldKind" AS ENUM ('IT', 'NON_IT');

-- CreateEnum
CREATE TYPE "InternOrJob" AS ENUM ('INTERN', 'JOB');

-- CreateEnum
CREATE TYPE "TemplateId" AS ENUM ('CLASSIC', 'MODERN', 'CREATIVE', 'CORPORATE', 'TECH_MONO');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('TENTH', 'TWELFTH', 'DIPLOMA', 'UG', 'PG', 'MPHIL', 'PHD', 'OTHER');

-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('SME', 'LARGE');

-- CreateEnum
CREATE TYPE "JobField" AS ENUM ('IT', 'NON_IT');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('INTERNSHIP', 'FULL_TIME', 'PART_TIME', 'CONTRACT');

-- CreateEnum
CREATE TYPE "JobExperience" AS ENUM ('FRESHER', 'EXPERIENCED', 'ANY');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'REJECTED', 'HIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "PlanAudience" AS ENUM ('CANDIDATE', 'EMPLOYER_SME', 'EMPLOYER_LARGE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_CREATED', 'USER_LOGIN', 'USER_LOGOUT', 'USER_DELETED', 'PROFILE_APPROVED', 'PROFILE_REJECTED', 'JOB_APPROVED', 'JOB_REJECTED', 'JOB_DELETED', 'PLAN_CREATED', 'PLAN_UPDATED', 'PLAN_DELETED', 'SUBSCRIPTION_REFUNDED', 'ADMIN_NOTE_ADDED', 'PRICING_CHANGED', 'SYSTEM_SETTING_CHANGED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "mobile" TEXT,
    "mobileVerified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ip" TEXT,
    "userAgent" VARCHAR(512),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "photoUrl" VARCHAR(512),
    "alternateMobile" TEXT,
    "currentDistrictId" TEXT,
    "currentTalukId" TEXT,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "currentPincode" TEXT,
    "currentStreet" VARCHAR(255),
    "preferredDistrictId" TEXT,
    "preferredTalukId" TEXT,
    "preferredLat" DOUBLE PRECISION,
    "preferredLng" DOUBLE PRECISION,
    "preferredPincode" TEXT,
    "preferredLocation" TEXT,
    "shortTermAmbition" TEXT,
    "longTermAmbition" TEXT,
    "type" "CandidateType",
    "internOrJob" "InternOrJob",
    "field" "FieldKind",
    "itSpecialization" TEXT,
    "itLanguages" JSONB,
    "nonItDepartments" JSONB,
    "yearsOfExperience" INTEGER,
    "topSkills" JSONB,
    "selectedTemplateId" "TemplateId",
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "moderationNotes" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "moderatedById" TEXT,

    CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "level" "EducationLevel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "percentage" DOUBLE PRECISION,
    "passedOutYear" INTEGER,
    "thesis" TEXT,
    "courseName" TEXT,
    "institution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "fromDate" TEXT NOT NULL,
    "toDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companySize" "CompanySize" NOT NULL DEFAULT 'SME',
    "industry" TEXT,
    "website" TEXT,
    "about" TEXT,
    "logoUrl" VARCHAR(512),
    "districtId" TEXT,
    "talukId" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "pincode" TEXT,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "moderationNotes" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "moderatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "employerName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "districtId" TEXT,
    "talukId" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "pincode" TEXT,
    "street" VARCHAR(255),
    "field" "JobField" NOT NULL,
    "type" "JobType" NOT NULL,
    "experience" "JobExperience" NOT NULL,
    "yearsMin" INTEGER,
    "yearsMax" INTEGER,
    "salaryRange" TEXT,
    "skills" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'ACTIVE',
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "moderationNotes" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "moderatedById" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "profileId" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "matchScore" INTEGER,
    "coverNote" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_jobs" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "audience" "PlanAudience" NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "priceInPaise" INTEGER NOT NULL,
    "gstApplies" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentRef" TEXT,
    "amountInPaise" INTEGER NOT NULL,
    "gstInPaise" INTEGER NOT NULL DEFAULT 0,
    "totalInPaise" INTEGER NOT NULL,
    "invoiceNumber" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "refundRef" TEXT,
    "refundedById" TEXT,
    "refundReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" "UserRole",
    "action" "AuditAction" NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "payload" JSONB,
    "ip" TEXT,
    "userAgent" VARCHAR(512),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "otp_tokens_email_purpose_idx" ON "otp_tokens"("email", "purpose");

-- CreateIndex
CREATE INDEX "otp_tokens_expiresAt_idx" ON "otp_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_profiles_userId_key" ON "candidate_profiles"("userId");

-- CreateIndex
CREATE INDEX "candidate_profiles_moderationStatus_idx" ON "candidate_profiles"("moderationStatus");

-- CreateIndex
CREATE INDEX "candidate_profiles_type_field_idx" ON "candidate_profiles"("type", "field");

-- CreateIndex
CREATE INDEX "candidate_profiles_currentDistrictId_idx" ON "candidate_profiles"("currentDistrictId");

-- CreateIndex
CREATE INDEX "candidate_profiles_preferredDistrictId_idx" ON "candidate_profiles"("preferredDistrictId");

-- CreateIndex
CREATE UNIQUE INDEX "education_profileId_level_key" ON "education"("profileId", "level");

-- CreateIndex
CREATE INDEX "experiences_profileId_idx" ON "experiences"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "employer_profiles_userId_key" ON "employer_profiles"("userId");

-- CreateIndex
CREATE INDEX "employer_profiles_moderationStatus_idx" ON "employer_profiles"("moderationStatus");

-- CreateIndex
CREATE INDEX "jobs_status_moderationStatus_idx" ON "jobs"("status", "moderationStatus");

-- CreateIndex
CREATE INDEX "jobs_field_type_experience_idx" ON "jobs"("field", "type", "experience");

-- CreateIndex
CREATE INDEX "jobs_districtId_idx" ON "jobs"("districtId");

-- CreateIndex
CREATE INDEX "jobs_employerId_idx" ON "jobs"("employerId");

-- CreateIndex
CREATE INDEX "jobs_postedAt_idx" ON "jobs"("postedAt");

-- CreateIndex
CREATE INDEX "applications_candidateId_idx" ON "applications"("candidateId");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "applications_jobId_candidateId_key" ON "applications"("jobId", "candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_jobs_candidateId_jobId_key" ON "saved_jobs"("candidateId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "plans_key_key" ON "plans"("key");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_invoiceNumber_key" ON "subscriptions"("invoiceNumber");

-- CreateIndex
CREATE INDEX "subscriptions_userId_expiresAt_idx" ON "subscriptions"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "subscriptions_paymentStatus_idx" ON "subscriptions"("paymentStatus");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "otp_tokens" ADD CONSTRAINT "otp_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education" ADD CONSTRAINT "education_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_profiles" ADD CONSTRAINT "employer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "candidate_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

