import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Patch,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';
import { CreateTaskReminderDto } from './dto/create-task-reminder.dto';
import { UpdateTaskReminderDto } from './dto/update-task-reminder.dto';
import { TaskReminderResponseDto } from './dto/responses/task-reminder-response.dto';
import { TaskRemindersService } from './task-reminders.service';

import type { CurrentUser } from '../auth/types/current-user.type';
import type { TaskReminder } from '../../generated/prisma/client';

@ApiTags('Task reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/reminders')
export class TaskRemindersController {
  constructor(private readonly taskRemindersService: TaskRemindersService) {}

  @ApiOperation({ summary: 'Create task reminder' })
  @ApiCreatedResponse({ type: TaskReminderResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() createTaskReminderDto: CreateTaskReminderDto,
  ): Promise<TaskReminder> {
    return this.taskRemindersService.create(
      taskId,
      user.id,
      createTaskReminderDto,
    );
  }

  @ApiOperation({ summary: 'Get my reminders for a task' })
  @ApiOkResponse({ type: TaskReminderResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<TaskReminder[]> {
    return this.taskRemindersService.findAll(user.id, taskId);
  }

  @ApiOperation({ summary: 'Delete pending reminder' })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task reminder not found' })
  @HttpCode(200)
  @Delete(':id')
  async remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    await this.taskRemindersService.remove(user.id, taskId, id);

    return { success: true };
  }

  @ApiOperation({ summary: 'Reschedule reminder' })
  @ApiOkResponse({ type: TaskReminderResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task reminder not found' })
  @ApiBadRequestResponse({
    description: 'Invalid reminder date or reminder already sent',
  })
  @Patch(':id')
  update(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskReminderDto: UpdateTaskReminderDto,
  ): Promise<TaskReminder> {
    return this.taskRemindersService.update(
      user.id,
      taskId,
      id,
      updateTaskReminderDto,
    );
  }
}
