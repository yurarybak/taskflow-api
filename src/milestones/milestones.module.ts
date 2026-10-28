import { Module } from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { MilestonesController } from './milestones.controller';
import { WorkspaceAccessModule } from '../workspace-access/workspace-access.module';

@Module({
  providers: [MilestonesService],
  controllers: [MilestonesController],
  imports: [WorkspaceAccessModule],
})
export class MilestonesModule {}
