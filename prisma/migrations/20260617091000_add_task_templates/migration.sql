-- CreateTable
CREATE TABLE "task_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL DEFAULT 'TASK',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LabelToTaskTemplate" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LabelToTaskTemplate_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_templates_workspaceId_name_key" ON "task_templates"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "_LabelToTaskTemplate_B_index" ON "_LabelToTaskTemplate"("B");

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LabelToTaskTemplate" ADD CONSTRAINT "_LabelToTaskTemplate_A_fkey" FOREIGN KEY ("A") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LabelToTaskTemplate" ADD CONSTRAINT "_LabelToTaskTemplate_B_fkey" FOREIGN KEY ("B") REFERENCES "task_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
