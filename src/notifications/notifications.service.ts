import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FindWorklogsQueryDto } from './dto/find-notifications-query.dto';
import { createPaginationMeta } from '../common/utils/create-pagination-meta';
import { PrismaTransactionClient } from '../prisma/types/prisma-transaction-client.type';

import type { CreateNotificationInput } from './types/create-notification-input.type';
import type { PaginatedResponse } from '../common/types/paginated-response.type';
import type { Notification } from '../../generated/prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async findOneByMember(
    id: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification was not found');
    }

    return notification;
  }

  async findAll(
    userId: string,
    query: FindWorklogsQueryDto,
  ): Promise<PaginatedResponse<Notification>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          userId,
          ...(query.unreadOnly && {
            readAt: null,
          }),
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: {
          userId,
        },
      }),
    ]);

    return {
      data: notifications,
      meta: createPaginationMeta(total, page, limit),
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const count = this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });

    return count;
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.findOneByMember(id, userId);

    await this.prisma.notification.update({
      where: {
        id,
        userId,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOneByMember(id, userId);

    await this.prisma.notification.delete({
      where: {
        id,
        userId,
      },
    });
  }

  create(
    input: CreateNotificationInput,
    tx?: PrismaTransactionClient,
  ): Promise<Notification> {
    const prisma = tx || this.prisma;

    return prisma.notification.create({
      data: input,
    });
  }
}
