import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiTags,
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
  ParseUUIDPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FindProjectsQueryDto } from './dto/find-projects-query.dto';
import { ProjectResponseDto } from './dto/responses/project-response.dto';
import { PaginatedProjectsResponseDto } from './dto/responses/paginated-projects-response.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';

import type { CurrentUser } from '../auth/types/current-user.type';
import type { Project } from '../../generated/prisma/client';
import type { PaginatedResponse } from '../common/types/paginated-response.type';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

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
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<Project> {
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
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: FindProjectsQueryDto,
  ): Promise<PaginatedResponse<Project>> {
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
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<Project> {
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
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.update(user.id, projectId, updateProjectDto);
  }

  @ApiOperation({ summary: 'Delete a project by ID' })
  @ApiOkResponse({
    type: SuccessResponseDto,
    description: 'Project deleted successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @Delete(':projectId')
  async remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<{ success: boolean }> {
    await this.projectsService.remove(user.id, projectId);

    return {
      success: true,
    };
  }
}
