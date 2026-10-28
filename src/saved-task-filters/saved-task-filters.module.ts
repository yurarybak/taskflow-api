import { Module } from '@nestjs/common';
import { SavedTaskFiltersService } from './saved-task-filters.service';
import { SavedTaskFiltersController } from './saved-task-filters.controller';
import { WorkspaceAccessModule } from '../workspace-access/workspace-access.module';

@Module({
  providers: [SavedTaskFiltersService],
  controllers: [SavedTaskFiltersController],
  imports: [WorkspaceAccessModule],
})
export class SavedTaskFiltersModule {}
