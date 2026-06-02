import { Module } from '@nestjs/common';
import { TaskActivityService } from './task-activity.service';
import { TaskActivityController } from './task-activity.controller';

@Module({
  providers: [TaskActivityService],
  controllers: [TaskActivityController]
})
export class TaskActivityModule {}
