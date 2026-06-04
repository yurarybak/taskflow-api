import { Module } from '@nestjs/common';
import { ChecklistItemsService } from './checklist-items.service';
import { ChecklistItemsController } from './checklist-items.controller';

@Module({
  providers: [ChecklistItemsService],
  controllers: [ChecklistItemsController]
})
export class ChecklistItemsModule {}
