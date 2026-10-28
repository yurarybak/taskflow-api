import { Module } from '@nestjs/common';
import { ChecklistItemsService } from './checklist-items.service';
import { ChecklistItemsController } from './checklist-items.controller';
import { TaskActivityModule } from '../task-activity/task-activity.module';
import { WorkspaceAccessModule } from '../workspace-access/workspace-access.module';

@Module({
  imports: [TaskActivityModule, WorkspaceAccessModule],
  providers: [ChecklistItemsService],
  controllers: [ChecklistItemsController],
})
export class ChecklistItemsModule {}
