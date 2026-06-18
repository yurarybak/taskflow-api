-- CreateEnum
CREATE TYPE "RecurringTaskStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateTable
CREATE TABLE "recurring_tasks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "intervalDays" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "status" "RecurringTaskStatus" NOT NULL DEFAULT 'ACTIVE',
    "templateId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "jobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recurring_tasks_jobId_key" ON "recurring_tasks"("jobId");

-- CreateIndex
CREATE INDEX "recurring_tasks_projectId_status_nextRunAt_idx" ON "recurring_tasks"("projectId", "status", "nextRunAt");

-- AddForeignKey
ALTER TABLE "recurring_tasks" ADD CONSTRAINT "recurring_tasks_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "task_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_tasks" ADD CONSTRAINT "recurring_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_tasks" ADD CONSTRAINT "recurring_tasks_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
