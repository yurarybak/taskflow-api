import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Controller,
  UseGuards,
  Post,
  Body,
  Param,
  Patch,
  Get,
  Delete,
  Query,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { CurrentUser } from '../auth/types/current-user.type';
import { TasksService } from './tasks.service';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto';
import { PaginatedTasksResponseDto } from './dto/responses/paginated-tasks-response.dto';
import { TaskResponseDto } from './dto/responses/task-response.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';

@ApiBearerAuth()
@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @ApiOperation({ summary: 'Create a new task in a project' })
  @ApiCreatedResponse({
    type: TaskResponseDto,
    description: 'The task has been successfully created',
  })
  @ApiConflictResponse({
    description: 'Project not found or user is not a member',
  })
  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(user.id, projectId, createTaskDto);
  }

  @ApiOperation({ summary: 'Update an existing task' })
  @ApiOkResponse({
    type: TaskResponseDto,
    description: 'The task has been successfully updated',
  })
  @ApiConflictResponse({
    description:
      'Task not found, user is not a member of the project, or insufficient permissions',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Patch(':taskId')
  update(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.id, projectId, taskId, updateTaskDto);
  }

  @ApiOperation({ summary: 'Get all tasks in a project' })
  @ApiOkResponse({
    type: PaginatedTasksResponseDto,
    description: 'The tasks have been successfully retrieved',
  })
  @ApiConflictResponse({
    description: 'Project not found or user is not a member',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Query() query: FindTasksQueryDto,
  ) {
    return this.tasksService.findAllByProject(user.id, projectId, query);
  }

  @ApiOperation({ summary: 'Get a specific task by ID' })
  @ApiOkResponse({
    type: TaskResponseDto,
    description: 'The task has been successfully retrieved',
  })
  @ApiConflictResponse({
    description: 'Task not found or user is not a member of the project',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get(':taskId')
  findOne(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.findOneByMember(user.id, taskId);
  }

  @ApiOperation({ summary: 'Delete a task' })
  @ApiOkResponse({
    type: SuccessResponseDto,
    description: 'The task has been successfully deleted',
  })
  @ApiConflictResponse({
    description:
      'Task not found, user is not a member of the project, or insufficient permissions',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Delete(':taskId')
  async remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId') taskId: string,
  ) {
    await this.tasksService.remove(user.id, taskId);

    return {
      success: true,
    };
  }

  @ApiOperation({ summary: 'Assign or unassign a task to a user' })
  @ApiOkResponse({
    type: TaskResponseDto,
    description: 'The task has been successfully updated with the new assignee',
  })
  @ApiConflictResponse({
    description:
      'Task not found, user is not a member of the project, or insufficient permissions',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Patch(':id/assign')
  assign(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Param('id') taskId: string,
    @Body() assignTaskDto: AssignTaskDto,
  ) {
    return this.tasksService.assign(
      user.id,
      projectId,
      taskId,
      assignTaskDto.assigneeId,
    );
  }
}
