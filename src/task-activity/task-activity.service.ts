import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaTransactionClient } from '../prisma/types/prisma-transaction-client.type';
import { FindTaskActivitiesQueryDto } from './dto/find-task-activities-query.dto';
import { createPaginationMeta } from '../common/utils/create-pagination-meta';

import type { CreateTaskActivityInput } from './types/create-task-activity.type';
import type { TaskActivityLog } from '../../generated/prisma/client';
import type { PaginatedResponse } from '../common/types/paginated-response.type';
import { WorkspaceAccessService } from '../workspace-access/workspace-access.service';

@Injectable()
export class TaskActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  create(
    input: CreateTaskActivityInput,
    tx?: PrismaTransactionClient,
  ): Promise<TaskActivityLog> {
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
    await this.workspaceAccessService.ensureTaskMember(taskId, userId);

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
