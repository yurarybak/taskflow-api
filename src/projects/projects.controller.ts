import { Controller, UseGuards, Post, Body, Param, Get } from '@nestjs/common';

import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('workspaces/:workspaceId/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @GetCurrentUser() user: { id: string; email: string },
    @Param('workspaceId') workspaceId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(user.id, workspaceId, createProjectDto);
  }

  @Get()
  findAll(
    @GetCurrentUser() user: { id: string; email: string },
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.projectsService.findAllByWorkspace(user.id, workspaceId);
  }

  @Get(':projectId')
  findOne(
    @GetCurrentUser() user: { id: string; email: string },
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.findOneByWorkspace(
      user.id,
      workspaceId,
      projectId,
    );
  }
}
