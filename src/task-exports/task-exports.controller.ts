import {
  Controller,
  UseGuards,
  Param,
  Post,
  Get,
  Delete,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { TaskExportsService } from './task-exports.service';
import { FindTaskExportsQueryDto } from './dto/find-task-exports-query.dto';
import { TaskExportResponseDto } from './dto/responses/task-export-response-dto';
import { PaginatedTaskExportsResponseDto } from './dto/responses/paginated-task-exports-response.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';

import type { CurrentUser } from '../auth/types/current-user.type';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/projects/:projectId/task-exports')
export class TaskExportsController {
  constructor(private readonly taskExportsService: TaskExportsService) {}

  @ApiCreatedResponse({ type: TaskExportResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
  ) {
    return this.taskExportsService.create(user.id, projectId);
  }

  @ApiCreatedResponse({
    type: PaginatedTaskExportsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Task not found or user is not a member',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Query() query: FindTaskExportsQueryDto,
  ) {
    return this.taskExportsService.findAllByMember(user.id, projectId, query);
  }

  @ApiOkResponse({ type: TaskExportResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task export not found' })
  @Get(':id')
  findOne(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.taskExportsService.findOneByMember(user.id, projectId, id);
  }

  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Task export not found' })
  @Delete(':id')
  async remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    await this.taskExportsService.remove(user.id, projectId, id);

    return {
      success: true,
    };
  }

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
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const { filePath, fileName } = await this.taskExportsService.download(
      user.id,
      projectId,
      id,
    );

    return response.download(filePath, fileName);
  }
}
