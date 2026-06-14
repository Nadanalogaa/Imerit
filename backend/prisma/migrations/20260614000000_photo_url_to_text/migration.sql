-- Widen the photo column so it can hold base64 data URLs (~5MB worst case)
-- instead of just short S3 paths. We'll swap back to VarChar(512) once we
-- migrate uploads to Cloudinary / S3.
ALTER TABLE "candidate_profiles" ALTER COLUMN "photoUrl" TYPE TEXT;
