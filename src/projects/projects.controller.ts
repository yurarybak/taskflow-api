import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import {
  Controller,
  UseGuards,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FindProjectsQueryDto } from './dto/find-projects-query.dto';
import { ProjectResponseDto } from './dto/responses/project-response.dto';
import { PaginatedProjectsResponseDto } from './dto/responses/paginated-projects-response.dto';

import type { CurrentUser } from '../auth/types/current-user.type';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  @ApiOperation({ summary: 'Create a new project in a workspace' })
  @ApiCreatedResponse({
    type: ProjectResponseDto,
    description: 'Project created successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Workspace not found' })
  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId') workspaceId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(user.id, workspaceId, createProjectDto);
  }

  @ApiOperation({ summary: 'Get all projects in a workspace' })
  @ApiOkResponse({
    type: PaginatedProjectsResponseDto,
    description: 'List of projects retrieved successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Workspace not found' })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId') workspaceId: string,
    @Query() query: FindProjectsQueryDto,
  ) {
    return this.projectsService.findAllByWorkspace(user.id, workspaceId, query);
  }

  @ApiOperation({ summary: 'Get a specific project by ID' })
  @ApiOkResponse({
    type: ProjectResponseDto,
    description: 'Project retrieved successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @Get(':projectId')
  findOne(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.findOneByMember(user.id, projectId);
  }

  @ApiOperation({ summary: 'Update a project by ID' })
  @ApiOkResponse({
    type: ProjectResponseDto,
    description: 'Project updated successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @Patch(':projectId')
  update(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(user.id, projectId, updateProjectDto);
  }

  @ApiOperation({ summary: 'Delete a project by ID' })
  @ApiOkResponse({
    type: ProjectResponseDto,
    description: 'Project deleted successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @Delete(':projectId')
  remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.remove(user.id, projectId);
  }
}
