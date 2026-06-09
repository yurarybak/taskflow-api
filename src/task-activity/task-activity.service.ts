import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaTransactionClient } from '../prisma/types/prisma-transaction-client.type';
import { FindTaskActivitiesQueryDto } from './dto/find-task-activities-query.dto';
import { createPaginationMeta } from '../common/utils/create-pagination-meta';

import type { CreateTaskActivityInput } from './types/create-task-activity.type';
import type { TaskActivityLog } from '../../generated/prisma/client';
import type { PaginatedResponse } from '../common/types/paginated-response.type';

@Injectable()
export class TaskActivityService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureTaskMember(taskId: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          workspace: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  create(input: CreateTaskActivityInput, tx?: PrismaTransactionClient) {
    const prisma = tx ?? this.prisma;

    return prisma.taskActivityLog.create({
      data: input,
    });
  }

  async findAllByTask(
    taskId: string,
    userId: string,
    query: FindTaskActivitiesQueryDto,
  ): Promise<PaginatedResponse<TaskActivityLog>> {
    await this.ensureTaskMember(taskId, userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [taskActivities, total] = await Promise.all([
      this.prisma.taskActivityLog.findMany({
        where: {
          taskId,
          actorId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.taskActivityLog.count({
        where: {
          taskId,
          actorId: userId,
        },
      }),
    ]);

    return {
      data: taskActivities,
      meta: createPaginationMeta(total, page, limit),
    };
  }
}
