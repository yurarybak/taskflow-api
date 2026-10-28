import {
  Controller,
  UseGuards,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { TaskActivityService } from './task-activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { FindTaskActivitiesQueryDto } from './dto/find-task-activities-query.dto';
import { PaginatedTaskActivitiesResponseDto } from './dto/responses/paginated-task-activities-response.dto';

import type { CurrentUser } from '../auth/types/current-user.type';
import type { TaskActivityLog } from '../../generated/prisma/client';
import type { PaginatedResponse } from '../common/types/paginated-response.type';

@ApiTags('Task activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/activity')
export class TaskActivityController {
  constructor(private readonly taskActivityService: TaskActivityService) {}

  @ApiOperation({ summary: 'Get activity logs for a task' })
  @ApiOkResponse({
    type: PaginatedTaskActivitiesResponseDto,
    description: 'List of activity logs for the specified task',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'Task not found or user is not a member',
  })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Query() query: FindTaskActivitiesQueryDto,
  ): Promise<PaginatedResponse<TaskActivityLog>> {
    return this.taskActivityService.findAllByTask(taskId, user.id, query);
  }
}
