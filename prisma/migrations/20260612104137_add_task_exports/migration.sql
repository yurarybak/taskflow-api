-- CreateEnum
CREATE TYPE "TaskExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "task_exports" (
    "id" TEXT NOT NULL,
    "status" "TaskExportStatus" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT,
    "storageName" TEXT,
    "error" TEXT,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "task_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_exports_storageName_key" ON "task_exports"("storageName");

-- CreateIndex
CREATE INDEX "task_exports_projectId_userId_createdAt_idx" ON "task_exports"("projectId", "userId", "createdAt");

-- AddForeignKey
ALTER TABLE "task_exports" ADD CONSTRAINT "task_exports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_exports" ADD CONSTRAINT "task_exports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
