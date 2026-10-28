import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { WorkspaceAccessModule } from '../workspace-access/workspace-access.module';

@Module({
  providers: [ProjectsService],
  controllers: [ProjectsController],
  imports: [WorkspaceAccessModule],
})
export class ProjectsModule {}
