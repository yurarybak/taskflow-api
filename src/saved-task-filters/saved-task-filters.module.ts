import { Module } from '@nestjs/common';
import { SavedTaskFiltersService } from './saved-task-filters.service';
import { SavedTaskFiltersController } from './saved-task-filters.controller';

@Module({
  providers: [SavedTaskFiltersService],
  controllers: [SavedTaskFiltersController]
})
export class SavedTaskFiltersModule {}
