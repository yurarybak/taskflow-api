import {
  Controller,
  UseGuards,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { WorklogsService } from './worklogs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { UpdateWorklogDto } from './dto/update-worklog.dto';

import type { CurrentUser } from '../auth/types/current-user.type';

// TODO:
// POST   /projects/:projectId/tasks/:taskId/worklogs
// GET    /projects/:projectId/tasks/:taskId/worklogs
// GET    /projects/:projectId/tasks/:taskId/worklogs/:id
// PATCH  /projects/:projectId/tasks/:taskId/worklogs/:id
// DELETE /projects/:projectId/tasks/:taskId/worklogs/:id

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/projects/:projectId/tasks/:taskId/worklogs')
export class WorklogsController {
  constructor(private readonly worklogsService: WorklogsService) {}

  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('/:projectId') projectId: string,
    @Param('/:taskId') taskId: string,
    @Body() createWorklogDto: CreateWorklogDto,
  ) {
    return this.worklogsService.create(
      user.id,
      projectId,
      taskId,
      createWorklogDto,
    );
  }

  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('/:projectId') projectId: string,
    @Param('/:taskId') taskId: string,
  ) {
    return this.worklogsService.findAll(user.id, projectId, taskId);
  }

  @Get('/:id')
  findOne(
    @GetCurrentUser() user: CurrentUser,
    @Param('/:projectId') projectId: string,
    @Param('/:taskId') taskId: string,
    @Param('/:id') id: string,
  ) {
    return this.worklogsService.findOne(user.id, projectId, taskId, id);
  }

  @Patch('/:id')
  update(
    @GetCurrentUser() user: CurrentUser,
    @Param('/:projectId') projectId: string,
    @Param('/:taskId') taskId: string,
    @Param('/:id') id: string,
    @Body() updateWorklogDto: UpdateWorklogDto,
  ) {
    return this.worklogsService.update(
      user.id,
      projectId,
      taskId,
      id,
      updateWorklogDto,
    );
  }

  @Delete('/:id')
  async remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('/:projectId') projectId: string,
    @Param('/:taskId') taskId: string,
    @Param('/:id') id: string,
  ) {
    await this.worklogsService.remove(user.id, projectId, taskId, id);

    return {
      success: true,
    };
  }
}
