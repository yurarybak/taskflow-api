import { Module, forwardRef } from '@nestjs/common';
import { TaskRemindersService } from './task-reminders.service';
import { TaskRemindersController } from './task-reminders.controller';
import { NotificationsQueueModule } from '../queues/notifications-queue/notifications-queue.module';

@Module({
  imports: [forwardRef(() => NotificationsQueueModule)],
  providers: [TaskRemindersService],
  controllers: [TaskRemindersController],
  exports: [TaskRemindersService],
})
export class TaskRemindersModule {}
