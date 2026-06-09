import { Module } from '@nestjs/common';
import { TaskWatchersService } from './task-watchers.service';
import { TaskWatchersController } from './task-watchers.controller';
import { TaskActivityModule } from '../task-activity/task-activity.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TaskActivityModule, NotificationsModule],
  providers: [TaskWatchersService],
  controllers: [TaskWatchersController],
})
export class TaskWatchersModule {}
