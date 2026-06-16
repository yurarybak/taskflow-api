/*
  Warnings:

  - A unique constraint covering the columns `[jobId]` on the table `task_exports` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "TaskExportStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "task_exports" ADD COLUMN     "jobId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "task_exports_jobId_key" ON "task_exports"("jobId");
