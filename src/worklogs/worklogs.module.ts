import { Module } from '@nestjs/common';
import { WorklogsService } from './worklogs.service';
import { WorklogsController } from './worklogs.controller';
import { TaskActivityModule } from '../task-activity/task-activity.module';
import { WorkspaceAccessModule } from '../workspace-access/workspace-access.module';

@Module({
  imports: [TaskActivityModule, WorkspaceAccessModule],
  providers: [WorklogsService],
  controllers: [WorklogsController],
})
export class WorklogsModule {}
