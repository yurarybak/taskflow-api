import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { Job } from 'bullmq';

import { ExportProjectTasksCsvJobPayload } from '../queues/task-export-queue/types/export-project-tasks-csv-job-payload.type';
import { PrismaService } from '../prisma/prisma.service';

import { TaskExportQueueService } from '../queues/task-export-queue/task-export-queue.service';
import { FindTaskExportsQueryDto } from './dto/find-task-exports-query.dto';
import { CreateTaskExportDto } from './dto/create-task-export.dto';
import { createPaginationMeta } from '../common/utils/create-pagination-meta';
import { TaskExportStatus } from '../../generated/prisma/enums';

import type { Prisma, TaskExport } from '../../generated/prisma/client';
import type { PaginatedResponse } from '../common/types/paginated-response.type';
import type { TaskExportFilters } from './types/task-export-filters.type';
import { WorkspaceAccessService } from '../workspace-access/workspace-access.service';

@Injectable()
export class TaskExportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskExportQueueService: TaskExportQueueService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  private readonly exportDirectory = join(
    process.cwd(),
    'uploads',
    'exports',
    'tasks',
  );

  private buildTasksCsv(
    tasks: {
      id: string;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      type: string;
      startDate: Date | null;
      dueDate: Date | null;
      archivedAt: Date | null;
      flaggedAt: Date | null;
      originalEstimateMinutes: number | null;
      remainingEstimateMinutes: number | null;
      timeSpentMinutes: number;
      createdAt: Date;
      updatedAt: Date;
      assignee: {
        email: string;
        firstName: string | null;
        lastName: string | null;
      } | null;
      creator: {
        email: string;
        firstName: string | null;
        lastName: string | null;
      };
      milestone: {
        name: string;
      } | null;
      labels: {
        name: string;
      }[];
    }[],
  ): string {
    const headers = [
      'ID',
      'Title',
      'Description',
      'Status',
      'Priority',
      'Type',
      'Assignee',
      'Creator',
      'Milestone',
      'Labels',
      'Start Date',
      'Due Date',
      'Archived At',
      'Flagged At',
      'Original Estimate Minutes',
      'Remaining Estimate Minutes',
      'Time Spent Minutes',
      'Created At',
      'Updated At',
    ];

    const rows = tasks.map((task) => [
      task.id,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.type,
      this.formatUser(task.assignee),
      this.formatUser(task.creator),
      task.milestone?.name,
      task.labels.map((label) => label.name).join(', '),
      this.formatDate(task.startDate),
      this.formatDate(task.dueDate),
      this.formatDate(task.archivedAt),
      this.formatDate(task.flaggedAt),
      task.originalEstimateMinutes,
      task.remainingEstimateMinutes,
      task.timeSpentMinutes,
      this.formatDate(task.createdAt),
      this.formatDate(task.updatedAt),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((value) => this.escapeCsvValue(value)).join(','))
      .join('\n');
  }

  private escapeCsvValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n')
    ) {
      return `"${stringValue.replaceAll('"', '""')}"`;
    }

    return stringValue;
  }

  private formatDate(value: Date | null): string {
    return value ? value.toISOString() : '';
  }

  private formatUser(
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    } | null,
  ): string {
    if (!user) {
      return '';
    }

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

    if (!fullName) {
      return user.email;
    }

    return `${fullName} (${user.email})`;
  }

  private parseExportFilters(filters: Prisma.JsonValue): TaskExportFilters {
    if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
      return {};
    }

    return filters;
  }

  private buildTaskExportWhere(
    projectId: string,
    filters: TaskExportFilters,
  ): Prisma.TaskWhereInput {
    return {
      projectId,
      ...(filters.taskIds?.length && {
        id: {
          in: filters.taskIds,
        },
      }),
      ...(!filters.includeArchived && {
        archivedAt: null,
      }),
      ...(filters.statuses?.length && {
        status: {
          in: filters.statuses,
        },
      }),
      ...(filters.priorities?.length && {
        priority: {
          in: filters.priorities,
        },
      }),
      ...(filters.types?.length && {
        type: {
          in: filters.types,
        },
      }),
      ...(filters.assigneeIds?.length &&
        !filters.withoutAssignee && {
          assigneeId: {
            in: filters.assigneeIds,
          },
        }),
      ...(filters.withoutAssignee && {
        assigneeId: null,
      }),
      ...(filters.milestoneIds?.length &&
        !filters.withoutMilestone && {
          milestoneId: {
            in: filters.milestoneIds,
          },
        }),
      ...(filters.withoutMilestone && {
        milestoneId: null,
      }),
      ...(filters.labelIds?.length && {
        labels: {
          some: {
            id: {
              in: filters.labelIds,
            },
          },
        },
      }),
      ...(filters.search && {
        OR: [
          {
            title: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };
  }

  private async updateExportProgress(
    exportId: string,
    progress: number,
    job?: Job<ExportProjectTasksCsvJobPayload>,
  ): Promise<void> {
    await this.prisma.taskExport.update({
      where: {
        id: exportId,
      },
      data: {
        progress,
      },
    });

    await job?.updateProgress(progress);
  }

  private async ensureExportNotCancelled(exportId: string): Promise<boolean> {
    const taskExport = await this.prisma.taskExport.findUnique({
      where: {
        id: exportId,
      },
      select: {
        status: true,
      },
    });

    if (taskExport?.status === TaskExportStatus.CANCELLED) {
      return false;
    }

    return true;
  }

  async findOne(exportId: string): Promise<TaskExport> {
    const taskExport = await this.prisma.taskExport.findFirst({
      where: {
        id: exportId,
      },
    });

    if (!taskExport) {
      throw new NotFoundException('Task export was not found');
    }

    return taskExport;
  }

  async generateProjectTasksCsv(
    exportId: string,
    job?: Job<ExportProjectTasksCsvJobPayload>,
  ): Promise<TaskExport | undefined> {
    const taskExport = await this.prisma.taskExport.findUnique({
      where: {
        id: exportId,
      },
    });

    if (!taskExport) {
      return;
    }

    await this.prisma.taskExport.update({
      where: {
        id: exportId,
      },
      data: {
        status: TaskExportStatus.PROCESSING,
        error: null,
        progress: 5,
      },
    });
    await job?.updateProgress(5);

    if (!(await this.ensureExportNotCancelled(exportId))) {
      return;
    }

    try {
      const filters = this.parseExportFilters(taskExport.filters);

      const where = this.buildTaskExportWhere(taskExport.projectId, filters);

      const tasks = await this.prisma.task.findMany({
        where,
        include: {
          assignee: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          creator: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          milestone: {
            select: {
              name: true,
            },
          },
          labels: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      await this.updateExportProgress(exportId, 30, job);

      if (!(await this.ensureExportNotCancelled(exportId))) {
        return;
      }

      await mkdir(this.exportDirectory, { recursive: true });

      const fileName = `taskflow-tasks-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      const storageName = `${taskExport.id}.csv`;
      const filePath = join(this.exportDirectory, storageName);

      const csv = this.buildTasksCsv(tasks);

      await this.updateExportProgress(exportId, 60, job);

      if (!(await this.ensureExportNotCancelled(exportId))) {
        return;
      }

      await writeFile(filePath, csv, 'utf8');

      await this.updateExportProgress(exportId, 90, job);

      if (!(await this.ensureExportNotCancelled(exportId))) {
        return;
      }

      const updateTaskExport = await this.prisma.taskExport.update({
        where: {
          id: exportId,
        },
        data: {
          status: TaskExportStatus.COMPLETED,
          progress: 100,
          fileName,
          storageName,
          completedAt: new Date(),
        },
      });

      await job?.updateProgress(100);

      return updateTaskExport;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.taskExport.update({
        where: {
          id: exportId,
        },
        data: {
          status: TaskExportStatus.FAILED,
          error: message,
        },
      });

      throw error;
    }
  }

  async create(
    userId: string,
    projectId: string,
    createTaskExportDto: CreateTaskExportDto,
  ): Promise<TaskExport> {
    await this.workspaceAccessService.ensureProjectMember(projectId, userId);

    const filters = {
      taskIds: createTaskExportDto.taskIds,
      statuses: createTaskExportDto.statuses,
      priorities: createTaskExportDto.priorities,
      types: createTaskExportDto.types,
      assigneeIds: createTaskExportDto.assigneeIds,
      labelIds: createTaskExportDto.labelIds,
      milestoneIds: createTaskExportDto.milestoneIds,
      withoutAssignee: createTaskExportDto.withoutAssignee,
      withoutMilestone: createTaskExportDto.withoutMilestone,
      includeArchived: createTaskExportDto.includeArchived,
      search: createTaskExportDto.search,
    };

    const taskExport = await this.prisma.taskExport.create({
      data: {
        userId,
        projectId,
        filters,
      },
    });

    const jobId = `task-export-${taskExport.id}`;

    await this.taskExportQueueService.addExportProjectTasksCsvJob(
      {
        exportId: taskExport.id,
      },
      jobId,
    );

    await this.prisma.taskExport.update({
      where: { id: taskExport.id },
      data: { jobId },
    });

    return taskExport;
  }

  async findAllByMember(
    userId: string,
    projectId: string,
    query: FindTaskExportsQueryDto,
  ): Promise<PaginatedResponse<TaskExport>> {
    await this.workspaceAccessService.ensureProjectMember(projectId, userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [taskExports, total] = await Promise.all([
      this.prisma.taskExport.findMany({
        where: {
          userId,
          projectId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.taskExport.count({
        where: {
          userId,
          projectId,
        },
      }),
    ]);

    return {
      data: taskExports,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  async findOneByMember(
    userId: string,
    projectId: string,
    id: string,
  ): Promise<TaskExport> {
    const taskExport = await this.prisma.taskExport.findFirst({
      where: {
        id,
        userId,
        projectId,
      },
    });

    if (!taskExport) {
      throw new NotFoundException('Task export not found');
    }

    return taskExport;
  }

  async remove(userId: string, projectId: string, id: string): Promise<void> {
    const taskExport = await this.findOneByMember(userId, projectId, id);

    if (taskExport.storageName) {
      const filePath = join(this.exportDirectory, taskExport.storageName);

      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    }

    await this.prisma.taskExport.delete({
      where: {
        userId,
        projectId,
        id,
      },
    });
  }

  async download(
    userId: string,
    projectId: string,
    id: string,
  ): Promise<{ filePath: string; fileName: string }> {
    const taskExport = await this.findOneByMember(userId, projectId, id);

    if (taskExport.status !== TaskExportStatus.COMPLETED) {
      throw new BadRequestException('Task export is not completed');
    }

    if (!taskExport.storageName || !taskExport.fileName) {
      throw new NotFoundException('Task export file not found');
    }

    const filePath = join(this.exportDirectory, taskExport.storageName);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Task export file not found');
    }

    return {
      filePath,
      fileName: taskExport.fileName,
    };
  }

  async cancel(userId: string, projectId: string, id: string): Promise<void> {
    const taskExport = await this.findOneByMember(userId, projectId, id);

    if (
      taskExport.status === TaskExportStatus.COMPLETED ||
      taskExport.status === TaskExportStatus.FAILED ||
      taskExport.status === TaskExportStatus.CANCELLED
    ) {
      throw new BadRequestException('Task export cannot be cancelled');
    }

    if (taskExport.jobId) {
      try {
        await this.taskExportQueueService.removeJob(taskExport.jobId);
      } catch {
        // Job can already be active and locked by worker.
        // In that case cooperative cancellation will stop it.
      }
    }

    await this.prisma.taskExport.update({
      where: {
        id: taskExport.id,
      },
      data: {
        status: TaskExportStatus.CANCELLED,
        error: null,
        completedAt: new Date(),
      },
    });
  }

  async retry(userId: string, projectId: string, id: string): Promise<void> {
    const taskExport = await this.findOneByMember(userId, projectId, id);

    if (
      taskExport.status !== TaskExportStatus.FAILED &&
      taskExport.status !== TaskExportStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Only failed or cancelled exports can be retried',
      );
    }

    const jobId = `task-export-${taskExport.id}-${Date.now()}`;

    // Reset the row before queueing: a fast worker could otherwise finish the job
    // and then have its COMPLETED status overwritten with PENDING.
    await this.prisma.taskExport.update({
      where: {
        id: taskExport.id,
      },
      data: {
        status: TaskExportStatus.PENDING,
        progress: 0,
        error: null,
        jobId,
        completedAt: null,
      },
    });

    try {
      await this.taskExportQueueService.addExportProjectTasksCsvJob(
        {
          exportId: taskExport.id,
        },
        jobId,
      );
    } catch (error: unknown) {
      await this.prisma.taskExport.update({
        where: {
          id: taskExport.id,
        },
        data: {
          status: TaskExportStatus.FAILED,
          error: 'Failed to queue export job',
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
