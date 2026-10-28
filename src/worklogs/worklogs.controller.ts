import {
  Controller,
  UseGuards,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
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
import { WorklogsService } from './worklogs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { UpdateWorklogDto } from './dto/update-worklog.dto';
import { WorklogResponseDto } from './dto/responses/worklog-response.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';
import { FindWorklogsQueryDto } from './dto/find-worklogs-query.dto';
import { PaginatedWorklogsResponseDto } from './dto/responses/paginated-worklogs-response.dto';

import type { CurrentUser } from '../auth/types/current-user.type';
import type { Worklog } from '../../generated/prisma/client';
import type { PaginatedResponse } from '../common/types/paginated-response.type';
import type { WorklogWithAuthor } from './types/worklog-with-author.type';

@ApiTags('Worklogs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/projects/:projectId/tasks/:taskId/worklogs')
export class WorklogsController {
  constructor(private readonly worklogsService: WorklogsService) {}

  @ApiOperation({ summary: 'Log time on a task' })
  @ApiCreatedResponse({ type: WorklogResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() createWorklogDto: CreateWorklogDto,
  ): Promise<WorklogWithAuthor> {
    return this.worklogsService.create(
      user.id,
      projectId,
      taskId,
      createWorklogDto,
    );
  }

  @ApiOperation({ summary: 'Get task worklogs' })
  @ApiOkResponse({ type: PaginatedWorklogsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Query() query: FindWorklogsQueryDto,
  ): Promise<PaginatedResponse<Worklog>> {
    return this.worklogsService.findAll(user.id, projectId, taskId, query);
  }

  @ApiOperation({ summary: 'Get worklog by id' })
  @ApiOkResponse({ type: WorklogResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Worklog not found' })
  @Get('/:id')
  findOne(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WorklogWithAuthor> {
    return this.worklogsService.findOne(user.id, projectId, taskId, id);
  }

  @ApiOperation({ summary: 'Update worklog' })
  @ApiOkResponse({ type: WorklogResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Worklog not found' })
  @Patch('/:id')
  update(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorklogDto: UpdateWorklogDto,
  ): Promise<WorklogWithAuthor> {
    return this.worklogsService.update(
      user.id,
      projectId,
      taskId,
      id,
      updateWorklogDto,
    );
  }

  @ApiOperation({ summary: 'Delete worklog' })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Worklog not found' })
  @Delete('/:id')
  async remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    await this.worklogsService.remove(user.id, projectId, taskId, id);

    return {
      success: true,
    };
  }
}
