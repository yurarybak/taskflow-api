-- CreateEnum
CREATE TYPE "TaskActivityType" AS ENUM ('TASK_CREATED', 'STATUS_CHANGED', 'ASSIGNEE_CHANGED', 'LABEL_ATTACHED', 'LABEL_DETACHED', 'COMMENT_CREATED');

-- CreateTable
CREATE TABLE "task_activity_logs" (
    "id" TEXT NOT NULL,
    "type" "TaskActivityType" NOT NULL,
    "metadata" JSONB,
    "taskId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_activity_logs_taskId_createdAt_idx" ON "task_activity_logs"("taskId", "createdAt");

-- AddForeignKey
ALTER TABLE "task_activity_logs" ADD CONSTRAINT "task_activity_logs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_activity_logs" ADD CONSTRAINT "task_activity_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
