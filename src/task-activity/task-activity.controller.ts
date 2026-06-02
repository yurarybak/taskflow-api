import { Controller, UseGuards, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { TaskActivityService } from './task-activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { TaskActivityResponseDto } from './dto/responses/task-activity-response.dto';

import type { CurrentUser } from '../auth/types/current-user.type';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/activity')
export class TaskActivityController {
  constructor(private readonly taskActivityService: TaskActivityService) {}

  @ApiOperation({ summary: 'Get activity logs for a task' })
  @ApiOkResponse({
    type: [TaskActivityResponseDto],
    description: 'List of activity logs for the specified task',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'Task not found or user is not a member',
  })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId') taskId: string,
  ) {
    return this.taskActivityService.findAllByTask(taskId, user.id);
  }
}
