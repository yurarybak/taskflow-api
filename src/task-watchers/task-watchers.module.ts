import { Module } from '@nestjs/common';
import { TaskWatchersService } from './task-watchers.service';
import { TaskWatchersController } from './task-watchers.controller';

@Module({
  providers: [TaskWatchersService],
  controllers: [TaskWatchersController]
})
export class TaskWatchersModule {}
