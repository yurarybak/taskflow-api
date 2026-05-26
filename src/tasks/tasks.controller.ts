import {
  Controller,
  UseGuards,
  Post,
  Body,
  Param,
  Patch,
  Get,
  Delete,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @GetCurrentUser() user: { id: string; email: string },
    @Param('projectId') projectId: string,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(user.id, projectId, createTaskDto);
  }

  @Patch(':taskId')
  update(
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(taskId, updateTaskDto);
  }

  @Get()
  findAll(
    @GetCurrentUser() user: { id: string; email: string },
    @Param('projectId') projectId: string,
  ) {
    return this.tasksService.findAllByProject(user.id, projectId);
  }

  @Get(':taskId')
  findOne(
    @GetCurrentUser() user: { id: string; email: string },
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.findOneByProjectOwner(user.id, taskId);
  }

  @Delete(':taskId')
  remove(@Param('taskId') taskId: string) {
    return this.tasksService.remove(taskId);
  }
}
