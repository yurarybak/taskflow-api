import { Module } from '@nestjs/common';
import { TaskRemindersService } from './task-reminders.service';
import { TaskRemindersController } from './task-reminders.controller';

@Module({
  providers: [TaskRemindersService],
  controllers: [TaskRemindersController],
  exports: [TaskRemindersService],
})
export class TaskRemindersModule {}
