-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "originalEstimateMinutes" INTEGER,
ADD COLUMN     "remainingEstimateMinutes" INTEGER,
ADD COLUMN     "timeSpentMinutes" INTEGER NOT NULL DEFAULT 0;
