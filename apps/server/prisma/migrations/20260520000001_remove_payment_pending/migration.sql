-- Remove payment_pending from JobStatus enum
-- Update any existing payment_pending jobs to open before removing the value
UPDATE "Job" SET "status" = 'open' WHERE "status" = 'payment_pending';

-- PostgreSQL requires recreating the enum to remove a value
ALTER TYPE "JobStatus" RENAME TO "JobStatus_old";
CREATE TYPE "JobStatus" AS ENUM ('open', 'accepted', 'en_route', 'completed', 'rejected', 'cancelled');
ALTER TABLE "Job" ALTER COLUMN "status" TYPE "JobStatus" USING "status"::text::"JobStatus";
DROP TYPE "JobStatus_old";
