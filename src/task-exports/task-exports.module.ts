import { Module, forwardRef } from '@nestjs/common';

import { TaskExportsService } from './task-exports.service';
import { TaskExportsController } from './task-exports.controller';
import { TaskExportQueueModule } from '../queues/task-export-queue/task-export-queue.module';
import { WorkspaceAccessModule } from '../workspace-access/workspace-access.module';

@Module({
  imports: [forwardRef(() => TaskExportQueueModule), WorkspaceAccessModule],
  providers: [TaskExportsService],
  controllers: [TaskExportsController],
  exports: [TaskExportsService],
})
export class TaskExportsModule {}
