import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskActivityModule } from '../task-activity/task-activity.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  providers: [TasksService],
  controllers: [TasksController],
  imports: [TaskActivityModule, NotificationsModule],
})
export class TasksModule {}
