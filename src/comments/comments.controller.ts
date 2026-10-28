import {
  Controller,
  UseGuards,
  Post,
  Body,
  Param,
  Patch,
  Get,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';

import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto } from './dto/responses/comment-response.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';
import { PaginatedCommentsResponseDto } from './dto/responses/paginated-comments-response.dto';
import { FindCommentsQueryDto } from './dto/find-comments-query.dto';

import type { CurrentUser } from '../auth/types/current-user.type';
import type { TaskComment } from '../../generated/prisma/client';
import type { PaginatedResponse } from '../common/types/paginated-response.type';
import type { TaskCommentWithAuthor } from './types/task-comment-with-author.type';

@ApiTags('Task comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiOperation({ summary: 'Create a new comment on a task' })
  @ApiCreatedResponse({
    type: CommentResponseDto,
    description: 'The comment has been successfully created',
  })
  @ApiNotFoundResponse({
    description: 'Task not found or user is not a member',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post()
  create(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<TaskCommentWithAuthor> {
    return this.commentsService.create(user.id, taskId, createCommentDto);
  }

  @ApiOperation({ summary: 'Update an existing comment on a task' })
  @ApiCreatedResponse({
    type: CommentResponseDto,
    description: 'The comment has been successfully updated',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found or user is not the author',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Patch(':commentId')
  update(
    @GetCurrentUser() user: CurrentUser,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<TaskCommentWithAuthor> {
    return this.commentsService.update(user.id, commentId, updateCommentDto);
  }

  @ApiOperation({ summary: 'Get a comment by its ID' })
  @ApiCreatedResponse({
    type: CommentResponseDto,
    description: 'The comment has been successfully retrieved',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found or user is not a member of the task',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get(':commentId')
  getComment(
    @GetCurrentUser() user: CurrentUser,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ): Promise<TaskCommentWithAuthor | null> {
    return this.commentsService.getComment(commentId, user.id);
  }

  @ApiOperation({ summary: 'Delete a comment by its ID' })
  @ApiCreatedResponse({
    description: 'The comment has been successfully deleted',
    type: SuccessResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Comment not found or user is not the author',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Delete(':commentId')
  async delete(
    @GetCurrentUser() user: CurrentUser,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ): Promise<{ success: boolean }> {
    await this.commentsService.delete(user.id, commentId);

    return {
      success: true,
    };
  }

  @ApiOperation({ summary: 'Get all comments for a task' })
  @ApiCreatedResponse({
    type: PaginatedCommentsResponseDto,
    description: 'The comments have been successfully retrieved',
  })
  @ApiNotFoundResponse({
    description: 'Task not found or user is not a member',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Query() query: FindCommentsQueryDto,
  ): Promise<PaginatedResponse<TaskComment>> {
    return this.commentsService.findAllByTask(taskId, user.id, query);
  }
}
