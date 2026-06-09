import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import type { CreateTaskActivityInput } from './types/create-task-activity.type';
import { PrismaTransactionClient } from '../prisma/types/prisma-transaction-client.type';

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

  async findAllByTask(taskId: string, userId: string) {
    await this.ensureTaskMember(taskId, userId);

    return this.prisma.taskActivityLog.findMany({
      where: {
        taskId,
        actorId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
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
    });
  }
}
