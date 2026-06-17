import {
  Controller,
  UseGuards,
  Body,
  Query,
  Param,
  Post,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { TaskTemplatesService } from './task-templates.service';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskTemplateDto } from './dto/create-task-template.dto';
import { UpdateTaskTemplateDto } from './dto/update-task-template.dto';
import { FindTaskTemplatesQueryDto } from './dto/find-task-templates-query.dto';
import { TaskTemplateResponseDto } from './dto/responses/task-template-response.dto';
import { PaginatedTasksResponseDto } from './dto/responses/paginated-task-templates-response.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';

import type { CurrentUser } from '../auth/types/current-user.type';

// POST   /workspaces/:workspaceId/task-templates
// GET    /workspaces/:workspaceId/task-templates
// GET    /workspaces/:workspaceId/task-templates/:id
// PATCH  /workspaces/:workspaceId/task-templates/:id
// DELETE /workspaces/:workspaceId/task-templates/:id

// POST /projects/:projectId/tasks/from-template

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/task-templates')
export class TaskTemplatesController {
  constructor(private readonly taskTemplatesService: TaskTemplatesService) {}

  @ApiCreatedResponse({ type: TaskTemplateResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Only owner or admin can manage templates',
  })
  @ApiNotFoundResponse({ description: 'Workspace or label not found' })
  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId') workspaceId: string,
    @Body() createTaskTemplateDto: CreateTaskTemplateDto,
  ) {
    return this.taskTemplatesService.create(
      user.id,
      workspaceId,
      createTaskTemplateDto,
    );
  }

  @ApiOkResponse({ type: PaginatedTasksResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Workspace not found' })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId') workspaceId: string,
    @Query() query: FindTaskTemplatesQueryDto,
  ) {
    return this.taskTemplatesService.findAll(user.id, workspaceId, query);
  }

  @ApiOkResponse({ type: TaskTemplateResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task template not found' })
  @Get(':id')
  findOne(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.taskTemplatesService.findOne(user.id, workspaceId, id);
  }

  @ApiOkResponse({ type: TaskTemplateResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Only owner or admin can manage templates',
  })
  @ApiNotFoundResponse({ description: 'Task template or label not found' })
  @Patch(':id')
  update(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() updateTaskTemplateDto: UpdateTaskTemplateDto,
  ) {
    return this.taskTemplatesService.update(
      user.id,
      workspaceId,
      id,
      updateTaskTemplateDto,
    );
  }

  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Only owner or admin can manage templates',
  })
  @ApiNotFoundResponse({ description: 'Task template not found' })
  @Delete(':id')
  async remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    await this.taskTemplatesService.remove(user.id, workspaceId, id);

    return {
      success: true,
    };
  }
}
