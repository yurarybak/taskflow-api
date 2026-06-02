import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { TaskActivityService } from '../task-activity/task-activity.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto';
import { createPaginationMeta } from '../common/utils/create-pagination-meta';
import { WorkspaceRole, TaskActivityType } from '../../generated/prisma/enums';

import type { Prisma, Task } from '../../generated/prisma/client';
import type { PaginatedResponse } from '../common/types/paginated-response.type';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskActivityService: TaskActivityService,
  ) {}

  private async ensureProjectMember(projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspace: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async ensureProjectMemberByUserId(projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspace: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Assignee not found');
    }

    return project;
  }

  private async ensureLabelInTaskWorkspace(taskId: string, labelId: string) {
    const label = await this.prisma.label.findFirst({
      where: {
        id: labelId,
        workspace: {
          projects: {
            some: {
              tasks: {
                some: {
                  id: taskId,
                },
              },
            },
          },
        },
      },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    return label;
  }

  private async getTaskWithMembership(taskId: string, userId: string) {
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
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: {
                    userId,
                  },
                  select: {
                    id: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const membership = task.project.workspace.members[0];

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return {
      task,
      membership,
    };
  }

  private canManageTask(
    creatorId: string,
    userId: string,
    role: WorkspaceRole,
  ) {
    const canManageAnyTask =
      role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN;

    const canManageOwnTask = creatorId === userId;

    return canManageAnyTask || canManageOwnTask;
  }

  async create(
    creatorId: string,
    projectId: string,
    createTaskDto: CreateTaskDto,
  ) {
    await this.ensureProjectMember(projectId, creatorId);

    if (createTaskDto.assigneeId) {
      await this.ensureProjectMemberByUserId(
        projectId,
        createTaskDto.assigneeId,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          ...createTaskDto,
          projectId,
          creatorId,
        },
      });

      await this.taskActivityService.create(
        {
          taskId: task.id,
          actorId: creatorId,
          type: TaskActivityType.TASK_CREATED,
        },
        tx,
      );

      return task;
    });
  }

  async update(
    userId: string,
    projectId: string,
    taskId: string,
    updateTaskDto: UpdateTaskDto,
  ) {
    const { task, membership } = await this.getTaskWithMembership(
      taskId,
      userId,
    );

    // Only privileged members or the task creator can update the task.
    if (!this.canManageTask(task.creatorId, userId, membership.role)) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: {
          id: taskId,
        },
        data: {
          ...updateTaskDto,
        },
      });

      if (updateTaskDto.status && updateTaskDto.status !== task.status) {
        await this.taskActivityService.create(
          {
            taskId: updatedTask.id,
            actorId: userId,
            type: TaskActivityType.STATUS_CHANGED,
            metadata: {
              from: task.status,
              to: updateTaskDto.status,
            },
          },
          tx,
        );
      }

      return updatedTask;
    });
  }

  findOneByMember(userId: string, taskId: string) {
    return this.prisma.task.findFirst({
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
  }

  async findAllByProject(
    userId: string,
    projectId: string,
    query: FindTasksQueryDto,
  ): Promise<PaginatedResponse<Task>> {
    await this.ensureProjectMember(projectId, userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const assigneeFilter = query.unassigned
      ? null
      : query.assigneeIds?.length
        ? { in: query.assigneeIds }
        : undefined;

    const where: Prisma.TaskWhereInput = {
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
      status: query.status,
      priority: query.priority,
      type: query.type,
      assigneeId: assigneeFilter,
      OR: query.search
        ? [
            {
              title: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
          ]
        : undefined,
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.task.count({
        where,
      }),
    ]);

    return {
      data: tasks,
      meta: createPaginationMeta(total, page, limit),
    };
  }

  async remove(userId: string, taskId: string) {
    const { task, membership } = await this.getTaskWithMembership(
      taskId,
      userId,
    );

    // Only allow deleting if the user can manage any task or if they can manage their own task
    if (!this.canManageTask(task.creatorId, userId, membership.role)) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.delete({
      where: {
        id: taskId,
      },
    });
  }

  async assign(
    userId: string,
    projectId: string,
    taskId: string,
    assigneeId: string | null,
  ) {
    await this.ensureProjectMember(projectId, userId);

    if (assigneeId) {
      await this.ensureProjectMemberByUserId(projectId, assigneeId);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: {
          id: taskId,
        },
        data: {
          assigneeId,
        },
      });

      await this.taskActivityService.create(
        {
          taskId: updatedTask.id,
          actorId: userId,
          type: TaskActivityType.ASSIGNEE_CHANGED,
          metadata: {
            from: updatedTask.assigneeId,
            to: assigneeId,
          },
        },
        tx,
      );

      return updatedTask;
    });
  }

  async attachLabel(taskId: string, labelId: string, userId: string) {
    const { task, membership } = await this.getTaskWithMembership(
      taskId,
      userId,
    );

    // Only allow attaching label if the user can manage any task or if they can manage their own task
    if (!this.canManageTask(task.creatorId, userId, membership.role)) {
      throw new NotFoundException('Task not found');
    }

    const label = await this.ensureLabelInTaskWorkspace(taskId, labelId);

    return this.prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: {
          id: taskId,
        },
        data: {
          labels: {
            connect: {
              id: labelId,
            },
          },
        },
        include: {
          labels: true,
        },
      });

      await this.taskActivityService.create(
        {
          taskId,
          actorId: userId,
          type: TaskActivityType.LABEL_ATTACHED,
          metadata: {
            labelId: label.id,
            labelName: label.name,
          },
        },
        tx,
      );

      return updatedTask;
    });
  }

  async detachLabel(taskId: string, labelId: string, userId: string) {
    const { task, membership } = await this.getTaskWithMembership(
      taskId,
      userId,
    );

    // Only allow detaching label if the user can manage any task or if they can manage their own task
    if (!this.canManageTask(task.creatorId, userId, membership.role)) {
      throw new NotFoundException('Task not found');
    }

    const label = await this.ensureLabelInTaskWorkspace(taskId, labelId);

    return this.prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: {
          id: taskId,
        },
        data: {
          labels: {
            disconnect: {
              id: labelId,
            },
          },
        },
      });
      await this.taskActivityService.create(
        {
          taskId: updatedTask.id,
          actorId: userId,
          type: TaskActivityType.LABEL_DETACHED,
          metadata: {
            labelId: label.id,
            labelName: label.name,
          },
        },
        tx,
      );

      return updatedTask;
    });
  }
}
