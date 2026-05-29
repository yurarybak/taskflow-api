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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';

import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto } from './dto/response/comment-response.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

import type { CurrentUser } from '../auth/types/current-user.type';

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
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
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
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
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
    @Param('commentId') commentId: string,
  ) {
    return this.commentsService.getComment(commentId, user.id);
  }

  @ApiOperation({ summary: 'Delete a comment by its ID' })
  @ApiCreatedResponse({
    type: CommentResponseDto,
    description: 'The comment has been successfully deleted',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found or user is not the author',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Delete(':commentId')
  delete(
    @GetCurrentUser() user: CurrentUser,
    @Param('commentId') commentId: string,
  ) {
    return this.commentsService.delete(user.id, commentId);
  }
}
