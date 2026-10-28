import { Module } from '@nestjs/common';
import { TaskWatchersService } from './task-watchers.service';
import { TaskWatchersController } from './task-watchers.controller';
import { TaskActivityModule } from '../task-activity/task-activity.module';
import { NotificationsQueueModule } from '../queues/notifications-queue/notifications-queue.module';
import { WorkspaceAccessModule } from '../workspace-access/workspace-access.module';

@Module({
  imports: [
    TaskActivityModule,
    NotificationsQueueModule,
    WorkspaceAccessModule,
  ],
  providers: [TaskWatchersService],
  controllers: [TaskWatchersController],
})
export class TaskWatchersModule {}
