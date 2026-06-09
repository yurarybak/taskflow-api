import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { TaskActivityService } from '../task-activity/task-activity.service';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { UpdateWorklogDto } from './dto/update-worklog.dto';
import { TaskActivityType } from '../../generated/prisma/enums';
import { PrismaTransactionClient } from '../prisma/types/prisma-transaction-client.type';

@Injectable()
export class WorklogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskActivityService: TaskActivityService,
  ) {}

  private async ensureTaskWorkspaceMember(
    userId: string,
    projectId: string,
    taskId: string,
  ) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
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
      throw new NotFoundException('Task was not found');
    }

    return task;
  }

  private async recalculateTaskTimeSpent(
    taskId: string,
    remainingEstimateMinutes: number | undefined,
    tx: PrismaTransactionClient,
  ) {
    const result = await tx.worklog.aggregate({
      where: {
        taskId,
      },
      _sum: {
        timeSpentMinutes: true,
      },
    });

    await tx.task.update({
      where: {
        id: taskId,
      },
      data: {
        timeSpentMinutes: result._sum.timeSpentMinutes ?? 0,
        ...(remainingEstimateMinutes !== undefined && {
          remainingEstimateMinutes,
        }),
      },
    });
  }

  private async findOneByMember(
    userId: string,
    projectId: string,
    taskId: string,
    worklogId: string,
  ) {
    await this.ensureTaskWorkspaceMember(userId, projectId, taskId);

    const worklog = await this.prisma.worklog.findFirst({
      where: {
        id: worklogId,
      },
      include: {
        author: this.getAuthorInclude(),
      },
    });

    if (!worklog) {
      throw new NotFoundException('Worklog was not found');
    }

    return worklog;
  }

  private getAuthorInclude() {
    return {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    };
  }

  async create(
    userId: string,
    projectId: string,
    taskId: string,
    createWorklogDto: CreateWorklogDto,
  ) {
    await this.ensureTaskWorkspaceMember(userId, projectId, taskId);

    return this.prisma.$transaction(async (tx) => {
      const worklog = await tx.worklog.create({
        data: {
          timeSpentMinutes: createWorklogDto.timeSpentMinutes,
          description: createWorklogDto.description,
          startedAt: createWorklogDto.startedAt,
          taskId,
          authorId: userId,
        },
        include: {
          author: this.getAuthorInclude(),
        },
      });

      await this.recalculateTaskTimeSpent(
        taskId,
        createWorklogDto.remainingEstimateMinutes,
        tx,
      );

      await this.taskActivityService.create(
        {
          actorId: userId,
          taskId,
          type: TaskActivityType.TIME_LOGGED,
          metadata: {
            worklogId: worklog.id,
            timeSpentMinutes: worklog.timeSpentMinutes,
            remainingEstimateMinutes: createWorklogDto.remainingEstimateMinutes,
          },
        },
        tx,
      );

      return worklog;
    });
  }

  async findAll(userId: string, projectId: string, taskId: string) {
    await this.ensureTaskWorkspaceMember(userId, projectId, taskId);

    return this.prisma.worklog.findMany({
      where: {
        taskId,
      },
      include: {
        author: this.getAuthorInclude(),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(
    userId: string,
    projectId: string,
    taskId: string,
    worklogId: string,
  ) {
    return this.findOneByMember(userId, projectId, taskId, worklogId);
  }

  async update(
    userId: string,
    projectId: string,
    taskId: string,
    worklogId: string,
    updateWorklogDto: UpdateWorklogDto,
  ) {
    const worklog = await this.findOneByMember(
      userId,
      projectId,
      taskId,
      worklogId,
    );

    if (worklog.authorId !== userId) {
      throw new ForbiddenException('You cannot manage this worklog');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedWorklog = await tx.worklog.update({
        where: {
          id: worklogId,
        },
        data: {
          timeSpentMinutes: updateWorklogDto.timeSpentMinutes,
          description: updateWorklogDto.description,
          startedAt: updateWorklogDto.startedAt,
        },
        include: {
          author: this.getAuthorInclude(),
        },
      });

      await this.recalculateTaskTimeSpent(
        taskId,
        updateWorklogDto.remainingEstimateMinutes,
        tx,
      );

      await this.taskActivityService.create(
        {
          taskId,
          actorId: userId,
          type: TaskActivityType.WORKLOG_UPDATED,
          metadata: {
            worklogId,
            from: {
              timeSpentMinutes: worklog.timeSpentMinutes,
              description: worklog.description,
              startedAt: worklog.startedAt.toISOString(),
            },
            to: {
              timeSpentMinutes: updatedWorklog.timeSpentMinutes,
              description: updatedWorklog.description,
              startedAt: updatedWorklog.startedAt.toISOString(),
              remainingEstimateMinutes:
                updateWorklogDto.remainingEstimateMinutes,
            },
          },
        },
        tx,
      );

      return updatedWorklog;
    });
  }

  async remove(
    userId: string,
    projectId: string,
    taskId: string,
    worklogId: string,
  ) {
    const worklog = await this.findOneByMember(
      userId,
      projectId,
      taskId,
      worklogId,
    );

    if (worklog.authorId !== userId) {
      throw new ForbiddenException('You cannot manage this worklog');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.worklog.delete({
        where: {
          id: worklogId,
        },
      });

      await this.recalculateTaskTimeSpent(taskId, undefined, tx);

      await this.taskActivityService.create(
        {
          taskId,
          actorId: userId,
          type: TaskActivityType.WORKLOG_DELETED,
          metadata: {
            worklogId,
            timeSpentMinutes: worklog.timeSpentMinutes,
          },
        },
        tx,
      );
    });
  }
}
