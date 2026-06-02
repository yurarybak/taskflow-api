import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskActivityModule } from '../task-activity/task-activity.module';

@Module({
  providers: [TasksService],
  controllers: [TasksController],
  imports: [TaskActivityModule],
})
export class TasksModule {}
