import { Controller, UseGuards, Post, Body, Param } from '@nestjs/common';
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
}
