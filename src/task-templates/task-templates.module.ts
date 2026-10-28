import { Module } from '@nestjs/common';
import { TaskTemplatesService } from './task-templates.service';
import { TaskTemplatesController } from './task-templates.controller';
import { WorkspaceAccessModule } from '../workspace-access/workspace-access.module';

@Module({
  providers: [TaskTemplatesService],
  controllers: [TaskTemplatesController],
  imports: [WorkspaceAccessModule],
})
export class TaskTemplatesModule {}
