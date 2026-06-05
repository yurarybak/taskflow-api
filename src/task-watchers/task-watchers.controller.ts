import {
  Controller,
  UseGuards,
  Get,
  Post,
  Delete,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { TaskWatchersService } from './task-watchers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';
import { TaskWatcherResponseDto } from './dto/responses/task-watcher-response.dto';

import type { CurrentUser } from '../auth/types/current-user.type';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/watchers')
export class TaskWatchersController {
  constructor(private readonly taskWatchersService: TaskWatchersService) {}

  @ApiOperation({ summary: 'Get task watchers' })
  @ApiOkResponse({
    description: 'Task watchers returned successfully',
    type: [TaskWatcherResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
  })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId') taskId: string,
  ) {
    return this.taskWatchersService.findAllByTask(user.id, taskId);
  }

  @ApiOperation({ summary: 'Watch task' })
  @ApiCreatedResponse({
    description: 'Current user added as watcher',
    type: TaskWatcherResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
  })
  @ApiConflictResponse({
    description: 'User is already watching this task',
  })
  @Post('/me')
  addMe(@GetCurrentUser() user: CurrentUser, @Param('taskId') taskId: string) {
    return this.taskWatchersService.addMe(user.id, taskId);
  }

  @ApiOperation({ summary: 'Unwatch task' })
  @ApiOkResponse({
    description: 'Current user removed from watchers',
    type: SuccessResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Watcher not found',
  })
  @Delete('/me')
  async removeMe(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId') taskId: string,
  ) {
    await this.taskWatchersService.removeMe(user.id, taskId);

    return {
      success: true,
    };
  }

  @ApiOperation({ summary: 'Add task watcher' })
  @ApiCreatedResponse({
    description: 'User added as watcher',
    type: TaskWatcherResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Task or workspace member not found',
  })
  @ApiConflictResponse({
    description: 'User is already watching this task',
  })
  @Post('/:userId')
  addWatcher(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId') taskId: string,
    @Param('userId') watcherUserId: string,
  ) {
    return this.taskWatchersService.addWatcher(user.id, taskId, watcherUserId);
  }

  @ApiOperation({ summary: 'Remove task watcher' })
  @ApiOkResponse({
    description: 'User removed from watchers',
    type: SuccessResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiNotFoundResponse({
    description: 'Watcher not found',
  })
  @Delete('/:userId')
  async removeWatcher(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId') taskId: string,
    @Param('userId') watcherUserId: string,
  ) {
    await this.taskWatchersService.removeWatcher(
      user.id,
      taskId,
      watcherUserId,
    );

    return {
      success: true,
    };
  }
}
