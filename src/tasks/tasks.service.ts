import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { TaskActivityService } from '../task-activity/task-activity.service';
import { TaskNotificationsService } from './task-notifications.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto';
import { SetTaskMilestoneDto } from './dto/set-task-milestone.dto';
import { CreateTaskFromTemplateDto } from './dto/create-task-from-template.dto';
import { createPaginationMeta } from '../common/utils/create-pagination-meta';
import {
  WorkspaceRole,
  TaskActivityType,
  TaskStatus,
} from '../../generated/prisma/enums';

import type {
  Label,
  Milestone,
  Prisma,
  Project,
  Task,
  TaskWatcher,
  Workspace,
  WorkspaceMember,
} from '../../generated/prisma/client';
import type { PaginatedResponse } from '../common/types/paginated-response.type';
import type {
  TaskWithLabels,
  TaskWithLabelsAndPeople,
} from './types/task-with-relations.type';
import { WorkspaceAccessService } from '../workspace-access/workspace-access.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskActivityService: TaskActivityService,
    private readonly taskNotificationsService: TaskNotificationsService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  private async ensureProjectMemberByUserId(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const isMember = await this.workspaceAccessService.isProjectMember(
      projectId,
      userId,
    );

    if (!isMember) {
      throw new NotFoundException('Assignee not found');
    }
  }

  private async ensureLabelInTaskWorkspace(
    taskId: string,
    labelId: string,
  ): Promise<Label> {
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

  private async getTaskWithMembership(
    taskId: string,
    userId: string,
  ): Promise<{
    task: Task & {
      project: Project & {
        workspace: Workspace & {
          members: Pick<WorkspaceMember, 'id' | 'role'>[];
        };
      };
      labels: Label[];
      watchers: TaskWatcher[];
    };
    membership: { id: string; role: WorkspaceRole };
  }> {
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
        watchers: true,
        labels: true,
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
  ): boolean {
    const canManageAnyTask =
      role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN;

    const canManageOwnTask = creatorId === userId;

    return canManageAnyTask || canManageOwnTask;
  }

  private validateTaskDates(
    startDate?: string | null,
    dueDate?: string | null,
  ): void {
    if (!startDate || !dueDate) {
      return;
    }

    if (new Date(startDate) > new Date(dueDate)) {
      throw new BadRequestException('Start date cannot be later than due date');
    }
  }

  private async ensureMilestoneInTaskProject(
    projectId: string,
    milestoneId: string,
  ): Promise<Milestone> {
    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        projectId,
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    return milestone;
  }

  async create(
    creatorId: string,
    projectId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<Task> {
    await this.workspaceAccessService.ensureProjectMember(projectId, creatorId);

    this.validateTaskDates(createTaskDto.startDate, createTaskDto.dueDate);

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
  ): Promise<Task> {
    const { task, membership } = await this.getTaskWithMembership(
      taskId,
      userId,
    );

    // Only privileged members or the task creator can update the task.
    if (!this.canManageTask(task.creatorId, userId, membership.role)) {
      throw new NotFoundException('Task not found');
    }

    const nextStartDate =
      updateTaskDto.startDate !== undefined
        ? updateTaskDto.startDate
        : task.startDate?.toISOString();

    const nextDueDate =
      updateTaskDto.dueDate !== undefined
        ? updateTaskDto.dueDate
        : task.dueDate?.toISOString();

    this.validateTaskDates(nextStartDate, nextDueDate);

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

        const watcherIds = task.watchers.map((watcher) => watcher.userId);
        await this.taskNotificationsService.notifyStatusChanged(
          userId,
          watcherIds,
          task,
        );
      }

      if (
        updateTaskDto.originalEstimateMinutes &&
        updateTaskDto.originalEstimateMinutes !== task.originalEstimateMinutes
      ) {
        await this.taskActivityService.create(
          {
            taskId: updatedTask.id,
            actorId: userId,
            type: TaskActivityType.ESTIMATE_CHANGED,
            metadata: {
              from: task.originalEstimateMinutes,
              to: updateTaskDto.originalEstimateMinutes,
            },
          },
          tx,
        );
      }

      return updatedTask;
    });
  }

  findOneByMember(userId: string, taskId: string): Promise<Task | null> {
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
    await this.workspaceAccessService.ensureProjectMember(projectId, userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const assigneeFilter = query.unassigned
      ? null
      : query.assigneeIds?.length
        ? { in: query.assigneeIds }
        : undefined;

    const statusFilter = query.statuses?.length
      ? { in: query.statuses }
      : undefined;

    const priorityFilter = query.priorities?.length
      ? { in: query.priorities }
      : undefined;

    const typeFilter = query.types?.length ? { in: query.types } : undefined;

    const archivedFilter =
      query.archived === undefined
        ? null
        : query.archived
          ? {
              not: null,
            }
          : null;

    const milestoneFilter = query.withoutMilestone
      ? null
      : query.milestoneIds?.length
        ? { in: query.milestoneIds }
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
      status: statusFilter,
      priority: priorityFilter,
      type: typeFilter,
      assigneeId: assigneeFilter,
      archivedAt: archivedFilter,
      milestoneId: milestoneFilter,
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

  async remove(userId: string, taskId: string): Promise<void> {
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
  ): Promise<Task> {
    await this.workspaceAccessService.ensureProjectMember(projectId, userId);

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

      await this.taskNotificationsService.notifyAssigned(
        userId,
        assigneeId,
        updatedTask,
      );

      return updatedTask;
    });
  }

  async attachLabel(
    taskId: string,
    labelId: string,
    userId: string,
  ): Promise<TaskWithLabels> {
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

  async detachLabel(
    taskId: string,
    labelId: string,
    userId: string,
  ): Promise<Task> {
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

  archive(userId: string, taskId: string): Promise<TaskWithLabels> {
    return this.updateWithActivity(
      userId,
      taskId,
      { archivedAt: new Date() },
      TaskActivityType.TASK_ARCHIVED,
    );
  }

  unarchive(userId: string, taskId: string): Promise<TaskWithLabels> {
    return this.updateWithActivity(
      userId,
      taskId,
      { archivedAt: null },
      TaskActivityType.TASK_UNARCHIVED,
    );
  }

  flag(userId: string, taskId: string): Promise<TaskWithLabels> {
    return this.updateWithActivity(
      userId,
      taskId,
      { flaggedAt: new Date() },
      TaskActivityType.TASK_FLAGGED,
    );
  }

  unflag(userId: string, taskId: string): Promise<TaskWithLabels> {
    return this.updateWithActivity(
      userId,
      taskId,
      { flaggedAt: null },
      TaskActivityType.TASK_UNFLAGGED,
    );
  }

  private async updateWithActivity(
    userId: string,
    taskId: string,
    data: Prisma.TaskUpdateInput,
    activityType: TaskActivityType,
  ): Promise<TaskWithLabels> {
    await this.getTaskWithMembership(taskId, userId);

    return this.prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: {
          id: taskId,
        },
        data,
        include: {
          labels: true,
        },
      });

      await this.taskActivityService.create(
        {
          taskId: updatedTask.id,
          actorId: userId,
          type: activityType,
        },
        tx,
      );

      return updatedTask;
    });
  }

  async clone(userId: string, taskId: string): Promise<TaskWithLabels> {
    const { task } = await this.getTaskWithMembership(taskId, userId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const createdTask = await tx.task.create({
        data: {
          title: `Copy of ${task.title}`,
          description: task.description,
          status: TaskStatus.TODO,
          priority: task.priority,
          projectId: task.projectId,
          creatorId: userId,
          assigneeId: task.assigneeId,
          labels: {
            connect: task.labels.map((label) => ({
              id: label.id,
            })),
          },
        },
        include: {
          labels: true,
        },
      });

      await this.taskActivityService.create(
        {
          taskId: createdTask.id,
          actorId: userId,
          type: TaskActivityType.TASK_CREATED,
        },
        tx,
      );

      return createdTask;
    });
  }

  async setMilestone(
    userId: string,
    projectId: string,
    taskId: string,
    setTaskMilestoneDto: SetTaskMilestoneDto,
  ): Promise<Task> {
    const { task } = await this.getTaskWithMembership(taskId, userId);

    const milestoneId = setTaskMilestoneDto.milestoneId;

    if (milestoneId) {
      await this.ensureMilestoneInTaskProject(projectId, milestoneId);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: {
          id: task.id,
        },
        data: {
          milestoneId,
        },
      });

      await this.taskActivityService.create(
        {
          actorId: userId,
          type: TaskActivityType.MILESTONE_CHANGED,
          taskId,
          metadata: {
            from: task.milestoneId,
            to: milestoneId,
          },
        },
        tx,
      );

      return updatedTask;
    });
  }

  async createTaskFromTemplate(
    userId: string,
    projectId: string,
    createTaskFromTemplateDto: CreateTaskFromTemplateDto,
  ): Promise<TaskWithLabelsAndPeople> {
    const project = await this.workspaceAccessService.ensureProjectMember(
      projectId,
      userId,
    );

    const taskTemplate = await this.prisma.taskTemplate.findFirst({
      where: {
        id: createTaskFromTemplateDto.templateId,
        workspaceId: project.workspaceId,
      },
      include: {
        labels: true,
      },
    });

    if (!taskTemplate) {
      throw new NotFoundException('Template was not found');
    }

    if (createTaskFromTemplateDto.assigneeId) {
      await this.ensureProjectMemberByUserId(
        projectId,
        createTaskFromTemplateDto.assigneeId,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title: createTaskFromTemplateDto.title ?? taskTemplate.title,
          description: taskTemplate.description,
          priority: taskTemplate.priority,
          type: taskTemplate.type,
          projectId: projectId,
          creatorId: userId,
          assigneeId: createTaskFromTemplateDto.assigneeId,
          dueDate: createTaskFromTemplateDto.dueDate,
          labels: {
            connect: taskTemplate.labels.map((label) => ({
              id: label.id,
            })),
          },
        },
        include: {
          assignee: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          labels: true,
        },
      });

      await this.taskActivityService.create(
        {
          taskId: task.id,
          actorId: userId,
          type: TaskActivityType.TASK_CREATED,
        },
        tx,
      );

      await tx.taskTemplate.update({
        where: {
          id: taskTemplate.id,
        },
        data: {
          usageCount: {
            increment: 1,
          },
          lastUsedAt: new Date(),
        },
      });

      return task;
    });
  }
}
