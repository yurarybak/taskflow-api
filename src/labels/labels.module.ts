import { Module } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { LabelsController } from './labels.controller';
import { WorkspaceAccessModule } from '../workspace-access/workspace-access.module';

@Module({
  providers: [LabelsService],
  controllers: [LabelsController],
  imports: [WorkspaceAccessModule],
})
export class LabelsModule {}
