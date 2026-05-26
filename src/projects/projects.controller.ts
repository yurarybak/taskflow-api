import {
  Controller,
  UseGuards,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';

import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { CurrentUser } from '../auth/types/current-user.type';

@Controller('workspaces/:workspaceId/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId') workspaceId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(user.id, workspaceId, createProjectDto);
  }

  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.projectsService.findAllByWorkspace(user.id, workspaceId);
  }

  @Get(':projectId')
  findOne(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.findOneByOwner(user.id, projectId);
  }

  @Patch(':projectId')
  update(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(user.id, projectId, updateProjectDto);
  }

  @Delete(':projectId')
  remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.remove(user.id, projectId);
  }
}
