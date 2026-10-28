import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskNotificationsService } from './task-notifications.service';
import { TasksController } from './tasks.controller';
import { TaskActivityModule } from '../task-activity/task-activity.module';
import { NotificationsQueueModule } from '../queues/notifications-queue/notifications-queue.module';
import { WorkspaceAccessModule } from '../workspace-access/workspace-access.module';

@Module({
  providers: [TasksService, TaskNotificationsService],
  controllers: [TasksController],
  imports: [
    TaskActivityModule,
    NotificationsQueueModule,
    WorkspaceAccessModule,
  ],
})
export class TasksModule {}
