import { BullModule } from '@nestjs/bullmq';
import { Module, forwardRef } from '@nestjs/common';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

import { TaskExportsModule } from '../../task-exports/task-exports.module';
import { TASK_EXPORT_QUEUE } from './task-export-queue.constants';
import { TaskExportQueueProcessor } from './task-export-queue.processor';
import { TaskExportQueueService } from './task-export-queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: TASK_EXPORT_QUEUE,
    }),
    BullBoardModule.forFeature({
      name: TASK_EXPORT_QUEUE,
      adapter: BullMQAdapter,
    }),
    forwardRef(() => TaskExportsModule),
  ],
  providers: [TaskExportQueueService, TaskExportQueueProcessor],
  exports: [TaskExportQueueService],
})
export class TaskExportQueueModule {}
