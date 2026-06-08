import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { TaskActivityService } from '../task-activity/task-activity.service';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { UpdateWorklogDto } from './dto/update-worklog.dto';
import { TaskActivityType } from '../../generated/prisma/enums';

@Injectable()
export class WorklogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskActivityService: TaskActivityService,
  ) {}

  private async ensureTaskMember(
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

  private async findOneByMember(
    userId: string,
    projectId: string,
    taskId: string,
    worklogId: string,
  ) {
    await this.ensureTaskMember(userId, projectId, taskId);

    const worklog = await this.prisma.worklog.findFirst({
      where: {
        id: worklogId,
      },
    });

    if (!worklog) {
      throw new NotFoundException('Worklog was not found');
    }

    return worklog;
  }

  async create(
    userId: string,
    projectId: string,
    taskId: string,
    createWorklogDto: CreateWorklogDto,
  ) {
    await this.ensureTaskMember(userId, projectId, taskId);

    return this.prisma.$transaction(async (tx) => {
      const worklog = await tx.worklog.create({
        data: {
          taskId,
          authorId: userId,
          ...createWorklogDto,
        },
      });

      await this.taskActivityService.create(
        {
          actorId: userId,
          taskId,
          type: TaskActivityType.TIME_LOGGED,
          metadata: {
            worklogId: worklog.id,
          },
        },
        tx,
      );

      return worklog;
    });
  }

  async findAll(userId: string, projectId: string, taskId: string) {
    await this.ensureTaskMember(userId, projectId, taskId);

    return this.prisma.worklog.findMany({
      where: {
        taskId,
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
      throw new NotFoundException('Worklog was not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.worklog.update({
        where: {
          id: worklog.id,
        },
        data: updateWorklogDto,
      });

      await this.taskActivityService.create(
        {
          actorId: userId,
          taskId,
          type: TaskActivityType.WORKLOG_UPDATED,
          metadata: {
            worklogId: worklog.id,
          },
        },
        tx,
      );

      return worklog;
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
      throw new NotFoundException('Worklog was not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.worklog.delete({
        where: {
          id: worklogId,
        },
      });

      await this.taskActivityService.create(
        {
          actorId: userId,
          taskId,
          type: TaskActivityType.WORKLOG_DELETED,
          metadata: {
            worklogId,
          },
        },
        tx,
      );
    });
  }
}
