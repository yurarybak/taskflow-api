-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TaskActivityType" ADD VALUE 'TASK_FLAGGED';
ALTER TYPE "TaskActivityType" ADD VALUE 'TASK_UNFLAGGED';

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "flaggedAt" TIMESTAMP(3);
