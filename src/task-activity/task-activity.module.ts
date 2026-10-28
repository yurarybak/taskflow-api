import { Module } from '@nestjs/common';
import { TaskActivityService } from './task-activity.service';
import { TaskActivityController } from './task-activity.controller';
import { WorkspaceAccessModule } from '../workspace-access/workspace-access.module';

@Module({
  providers: [TaskActivityService],
  exports: [TaskActivityService],
  controllers: [TaskActivityController],
  imports: [WorkspaceAccessModule],
})
export class TaskActivityModule {}
