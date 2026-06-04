import { Module } from '@nestjs/common';
import { TaskWatchersService } from './task-watchers.service';
import { TaskWatchersController } from './task-watchers.controller';
import { TaskActivityModule } from '../task-activity/task-activity.module';

@Module({
  imports: [TaskActivityModule],
  providers: [TaskWatchersService],
  controllers: [TaskWatchersController],
})
export class TaskWatchersModule {}
