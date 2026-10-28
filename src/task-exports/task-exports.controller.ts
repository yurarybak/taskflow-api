import {
  Controller,
  UseGuards,
  Param,
  Post,
  Get,
  Delete,
  Query,
  Res,
  Body,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { TaskExportsService } from './task-exports.service';
import { FindTaskExportsQueryDto } from './dto/find-task-exports-query.dto';
import { TaskExportResponseDto } from './dto/responses/task-export-response-dto';
import { PaginatedTaskExportsResponseDto } from './dto/responses/paginated-task-exports-response.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';
import { CreateTaskExportDto } from './dto/create-task-export.dto';

import type { CurrentUser } from '../auth/types/current-user.type';
import type { TaskExport } from '../../generated/prisma/client';
import type { PaginatedResponse } from '../common/types/paginated-response.type';

@ApiTags('Task exports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/projects/:projectId/task-exports')
export class TaskExportsController {
  constructor(private readonly taskExportsService: TaskExportsService) {}

  @ApiOperation({ summary: 'Start CSV export of project tasks' })
  @ApiCreatedResponse({ type: TaskExportResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() createTaskExportDto: CreateTaskExportDto,
  ): Promise<TaskExport> {
    return this.taskExportsService.create(
      user.id,
      projectId,
      createTaskExportDto,
    );
  }

  @ApiOperation({ summary: 'Get project task exports' })
  @ApiOkResponse({
    type: PaginatedTaskExportsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Project not found',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: FindTaskExportsQueryDto,
  ): Promise<PaginatedResponse<TaskExport>> {
    return this.taskExportsService.findAllByMember(user.id, projectId, query);
  }

  @ApiOperation({ summary: 'Get task export by id' })
  @ApiOkResponse({ type: TaskExportResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task export not found' })
  @Get(':id')
  findOne(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TaskExport> {
    return this.taskExportsService.findOneByMember(user.id, projectId, id);
  }

  @ApiOperation({ summary: 'Delete task export' })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task export not found' })
  @Delete(':id')
  async remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    await this.taskExportsService.remove(user.id, projectId, id);

    return {
      success: true,
    };
  }

  @ApiOperation({ summary: 'Download completed export CSV' })
  @ApiOkResponse({
    description: 'CSV file',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task export file not found' })
  @ApiBadRequestResponse({ description: 'Task export is not completed' })
  @Get(':id/download')
  async download(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const { filePath, fileName } = await this.taskExportsService.download(
      user.id,
      projectId,
      id,
    );

    return response.download(filePath, fileName);
  }

  @ApiOperation({ summary: 'Cancel pending or running export' })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Task export cannot be cancelled' })
  @ApiNotFoundResponse({ description: 'Task export not found' })
  @Patch(':id/cancel')
  async cancel(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    await this.taskExportsService.cancel(user.id, projectId, id);

    return {
      success: true,
    };
  }

  @ApiOperation({ summary: 'Retry failed or cancelled export' })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({
    description: 'Only failed or cancelled exports can be retried',
  })
  @ApiNotFoundResponse({ description: 'Task export not found' })
  @Patch(':id/retry')
  async retry(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    await this.taskExportsService.retry(user.id, projectId, id);

    return {
      success: true,
    };
  }
}
