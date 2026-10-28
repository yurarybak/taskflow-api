import {
  Controller,
  UseGuards,
  Param,
  Query,
  Get,
  Patch,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { FindWorklogsQueryDto } from './dto/find-notifications-query.dto';
import { PaginatedNotificationsResponseDto } from './dto/responses/notifications-response.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';

import type { CurrentUser } from '../auth/types/current-user.type';
import type { PaginatedResponse } from '../common/types/paginated-response.type';
import type { Notification } from '../../generated/prisma/client';

// TODO
// GET    /notifications
// GET    /notifications/unread-count
// PATCH  /notifications/:id/read
// PATCH  /notifications/read-all
// DELETE /notifications/:id

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'Get notifications of the current user' })
  @ApiOkResponse({ type: PaginatedNotificationsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Query() query: FindWorklogsQueryDto,
  ): Promise<PaginatedResponse<Notification>> {
    return this.notificationsService.findAll(user.id, query);
  }

  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiOkResponse({
    schema: {
      example: {
        count: 3,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get('/unread-count')
  async getUnreadCount(
    @GetCurrentUser() user: CurrentUser,
  ): Promise<{ count: number }> {
    const count = await this.notificationsService.getUnreadCount(user.id);

    return {
      count,
    };
  }

  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Notification not found' })
  @Patch('/:id/read')
  async markAsRead(
    @GetCurrentUser() user: CurrentUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    await this.notificationsService.markAsRead(id, user.id);

    return {
      success: true,
    };
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Patch('/read-all')
  async markAllAsRead(
    @GetCurrentUser() user: CurrentUser,
  ): Promise<{ success: boolean }> {
    await this.notificationsService.markAllAsRead(user.id);

    return {
      success: true,
    };
  }

  @ApiOperation({ summary: 'Delete notification' })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Notification not found' })
  @Delete('/:id')
  async remove(
    @GetCurrentUser() user: CurrentUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    await this.notificationsService.remove(id, user.id);

    return {
      success: true,
    };
  }
}
