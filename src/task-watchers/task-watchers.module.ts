import { Module } from '@nestjs/common';
import { TaskWatchersService } from './task-watchers.service';
import { TaskWatchersController } from './task-watchers.controller';
import { TaskActivityModule } from '../task-activity/task-activity.module';
import { NotificationsQueueModule } from '../queues/notifications-queue/notifications-queue.module';

@Module({
  imports: [TaskActivityModule, NotificationsQueueModule],
  providers: [TaskWatchersService],
  controllers: [TaskWatchersController],
})
export class TaskWatchersModule {}
