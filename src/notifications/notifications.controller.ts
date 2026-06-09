import {
  Controller,
  UseGuards,
  Param,
  Query,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { FindWorklogsQueryDto } from './dto/find-notifications-query.dto';
import { PaginatedNotificationsResponseDto } from './dto/responses/notifications-response.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';

import type { CurrentUser } from '../auth/types/current-user.type';

// TODO
// GET    /notifications
// GET    /notifications/unread-count
// PATCH  /notifications/:id/read
// PATCH  /notifications/read-all
// DELETE /notifications/:id

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOkResponse({ type: PaginatedNotificationsResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get()
  findAll(
    @GetCurrentUser() user: CurrentUser,
    @Query() query: FindWorklogsQueryDto,
  ) {
    return this.notificationsService.findAll(user.id, query);
  }

  @ApiOkResponse({
    schema: {
      example: {
        count: 3,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get('/unread-count')
  async getUnreadCount(@GetCurrentUser() user: CurrentUser) {
    const count = await this.notificationsService.getUnreadCount(user.id);

    return {
      count,
    };
  }

  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Notification not found' })
  @Patch('/:id/read')
  async markAsRead(
    @GetCurrentUser() user: CurrentUser,
    @Param('id') id: string,
  ) {
    await this.notificationsService.markAsRead(id, user.id);

    return {
      success: true,
    };
  }

  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Patch('/read-all')
  async markAllAsRead(@GetCurrentUser() user: CurrentUser) {
    await this.notificationsService.markAllAsRead(user.id);

    return {
      success: true,
    };
  }

  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Notification not found' })
  @Delete('/:id')
  async remove(@GetCurrentUser() user: CurrentUser, @Param('id') id: string) {
    await this.notificationsService.remove(id, user.id);

    return {
      success: true,
    };
  }
}
