import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto';
import { createPaginationMeta } from '../common/utils/create-pagination-meta';
import { WorkspaceRole } from '../../generated/prisma/enums';

import type { Prisma, Task } from '../../generated/prisma/client';
import type { PaginatedResponse } from '../common/types/paginated-response.type';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) { }

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

    return this.prisma.task.create({
      data: {
        ...createTaskDto,
        projectId,
        creatorId,
      },
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

    // Only allow deleting if the user can manage any task or if they can manage their own task
    if (!this.canManageTask(task.creatorId, userId, membership.role)) {
      throw new NotFoundException('Task not found');
    }

    // If assigneeId is being updated, ensure the new assignee is a member of the project
    if (updateTaskDto.assigneeId) {
      await this.ensureProjectMemberByUserId(
        projectId,
        updateTaskDto.assigneeId,
      );
    }

    return this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        ...updateTaskDto,
      },
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

    return this.prisma.task.delete({
      where: {
        id: taskId,
      },
    });
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

    return this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        assigneeId,
      },
    });
  }
}
