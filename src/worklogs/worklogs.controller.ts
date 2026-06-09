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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { WorklogsService } from './worklogs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { UpdateWorklogDto } from './dto/update-worklog.dto';
import { WorklogResponseDto } from './dto/responses/worklog-response.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';

import type { CurrentUser } from '../auth/types/current-user.type';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/projects/:projectId/tasks/:taskId/worklogs')
export class WorklogsController {
  constructor(private readonly worklogsService: WorklogsService) {}

  @ApiCreatedResponse({ type: WorklogResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() createWorklogDto: CreateWorklogDto,
  ) {
    return this.worklogsService.create(
      user.id,
      projectId,
      taskId,
      createWorklogDto,
    );
  }

  @ApiOkResponse({ type: WorklogResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.worklogsService.findAll(user.id, projectId, taskId);
  }

  @ApiOkResponse({ type: WorklogResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Worklog not found' })
  @Get('/:id')
  findOne(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('id') id: string,
  ) {
    return this.worklogsService.findOne(user.id, projectId, taskId, id);
  }

  @ApiOkResponse({ type: WorklogResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Worklog not found' })
  @Patch('/:id')
  update(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('id') id: string,
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

  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Worklog not found' })
  @Delete('/:id')
  async remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('id') id: string,
  ) {
    await this.worklogsService.remove(user.id, projectId, taskId, id);

    return {
      success: true,
    };
  }
}
