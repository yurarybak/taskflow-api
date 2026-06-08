-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TaskActivityType" ADD VALUE 'TIME_LOGGED';
ALTER TYPE "TaskActivityType" ADD VALUE 'WORKLOG_UPDATED';
ALTER TYPE "TaskActivityType" ADD VALUE 'WORKLOG_DELETED';

-- CreateTable
CREATE TABLE "worklogs" (
    "id" TEXT NOT NULL,
    "timeSpentMinutes" INTEGER NOT NULL,
    "description" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worklogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "worklogs_taskId_startedAt_idx" ON "worklogs"("taskId", "startedAt");

-- AddForeignKey
ALTER TABLE "worklogs" ADD CONSTRAINT "worklogs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worklogs" ADD CONSTRAINT "worklogs_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
