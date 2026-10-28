import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { WorkspaceAccessModule } from '../workspace-access/workspace-access.module';

@Module({
  providers: [WorkspacesService],
  controllers: [WorkspacesController],
  imports: [WorkspaceAccessModule],
})
export class WorkspacesModule {}
