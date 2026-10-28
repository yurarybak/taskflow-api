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
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';

import { TaskTemplatesService } from './task-templates.service';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskTemplateDto } from './dto/create-task-template.dto';
import { UpdateTaskTemplateDto } from './dto/update-task-template.dto';
import { FindTaskTemplatesQueryDto } from './dto/find-task-templates-query.dto';
import { TaskTemplateResponseDto } from './dto/responses/task-template-response.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';
import { BulkDeleteDto } from './dto/bulk-delete.dto';

import type { CurrentUser } from '../auth/types/current-user.type';
import type { TaskTemplate } from '../../generated/prisma/client';
import type { TaskTemplateWithLabels } from './types/task-template-with-labels.type';

@ApiTags('Task templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/task-templates')
export class TaskTemplatesController {
  constructor(private readonly taskTemplatesService: TaskTemplatesService) {}

  @ApiOperation({ summary: 'Create task template' })
  @ApiCreatedResponse({ type: TaskTemplateResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Workspace or label not found' })
  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createTaskTemplateDto: CreateTaskTemplateDto,
  ): Promise<TaskTemplate> {
    return this.taskTemplatesService.create(
      user.id,
      workspaceId,
      createTaskTemplateDto,
    );
  }

  @ApiOperation({ summary: 'Get workspace task templates' })
  @ApiOkResponse({ type: [TaskTemplateResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Workspace not found' })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: FindTaskTemplatesQueryDto,
  ): Promise<TaskTemplateWithLabels[]> {
    return this.taskTemplatesService.findAll(user.id, workspaceId, query);
  }

  @ApiOperation({ summary: 'Get task template by id' })
  @ApiOkResponse({ type: TaskTemplateResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task template not found' })
  @Get(':id')
  findOne(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TaskTemplateWithLabels> {
    return this.taskTemplatesService.findOne(user.id, workspaceId, id);
  }

  @ApiOperation({ summary: 'Update task template' })
  @ApiOkResponse({ type: TaskTemplateResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task template or label not found' })
  @Patch(':id')
  update(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskTemplateDto: UpdateTaskTemplateDto,
  ): Promise<TaskTemplateWithLabels> {
    return this.taskTemplatesService.update(
      user.id,
      workspaceId,
      id,
      updateTaskTemplateDto,
    );
  }

  @ApiOperation({ summary: 'Delete several task templates' })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'One or more task templates were not found',
  })
  @HttpCode(HttpStatus.OK)
  @Post('bulk-delete')
  async bulkDelete(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() bulkDeleteDto: BulkDeleteDto,
  ): Promise<{ success: boolean }> {
    await this.taskTemplatesService.bulkDelete(
      user.id,
      workspaceId,
      bulkDeleteDto,
    );

    return {
      success: true,
    };
  }

  @ApiOperation({ summary: 'Delete task template' })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task template not found' })
  @Delete(':id')
  async remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    await this.taskTemplatesService.remove(user.id, workspaceId, id);

    return {
      success: true,
    };
  }

  @ApiOperation({ summary: 'Duplicate task template' })
  @ApiCreatedResponse({ type: TaskTemplateResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task template not found' })
  @Post(':id/duplicate')
  duplicate(
    @GetCurrentUser() user: CurrentUser,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TaskTemplateWithLabels> {
    return this.taskTemplatesService.duplicate(user.id, workspaceId, id);
  }
}
