import { Module } from '@nestjs/common';
import { ChecklistItemsService } from './checklist-items.service';
import { ChecklistItemsController } from './checklist-items.controller';
import { TaskActivityModule } from '../task-activity/task-activity.module';

@Module({
  imports: [TaskActivityModule],
  providers: [ChecklistItemsService],
  controllers: [ChecklistItemsController],
})
export class ChecklistItemsModule {}
