CREATE TABLE "Review" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "operatorId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Review_jobId_key" ON "Review"("jobId");
CREATE INDEX "Review_operatorId_idx" ON "Review"("operatorId");

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_operatorId_fkey"
  FOREIGN KEY ("operatorId") REFERENCES "OperatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
