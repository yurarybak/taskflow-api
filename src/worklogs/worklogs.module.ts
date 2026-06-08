import { Module } from '@nestjs/common';
import { WorklogsService } from './worklogs.service';
import { WorklogsController } from './worklogs.controller';
import { TaskActivityModule } from '../task-activity/task-activity.module';

@Module({
  imports: [TaskActivityModule],
  providers: [WorklogsService],
  controllers: [WorklogsController],
})
export class WorklogsModule {}
