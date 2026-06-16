import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

import { TaskExportQueueService } from '../queues/task-export-queue/task-export-queue.service';
import { FindTaskExportsQueryDto } from './dto/find-task-exports-query.dto';
import { CreateTaskExportsDto } from './dto/create-task-exports.dto';
import { createPaginationMeta } from '../common/utils/create-pagination-meta';
import { TaskExportStatus } from '../../generated/prisma/enums';

import type { TaskExport } from '../../generated/prisma/client';
import type { PaginatedResponse } from '../common/types/paginated-response.type';

@Injectable()
export class TaskExportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskExportQueueService: TaskExportQueueService,
  ) {}

  private readonly exportDirectory = join(
    process.cwd(),
    'uploads',
    'exports',
    'tasks',
  );

  private async ensureProjectMember(userId: string, projectId: string) {
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
      throw new NotFoundException('Project was not found');
    }

    return project;
  }

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
  ) {
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

  private escapeCsvValue(value: string | number | null | undefined) {
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

  private formatDate(value: Date | null) {
    return value ? value.toISOString() : '';
  }

  private formatUser(
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    } | null,
  ) {
    if (!user) {
      return '';
    }

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

    if (!fullName) {
      return user.email;
    }

    return `${fullName} (${user.email})`;
  }

  async findOne(exportId: string) {
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

  async generateProjectTasksCsv(exportId: string) {
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
      },
    });

    try {
      const tasks = await this.prisma.task.findMany({
        where: {
          projectId: taskExport.projectId,
        },
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

      await mkdir(this.exportDirectory, { recursive: true });

      const fileName = `taskflow-tasks-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      const storageName = `${taskExport.id}.csv`;
      const filePath = join(this.exportDirectory, storageName);

      const csv = this.buildTasksCsv(tasks);

      await writeFile(filePath, csv, 'utf8');

      return this.prisma.taskExport.update({
        where: {
          id: exportId,
        },
        data: {
          status: TaskExportStatus.COMPLETED,
          fileName,
          storageName,
          completedAt: new Date(),
        },
      });
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
    createTaskExportsDto: CreateTaskExportsDto,
  ) {
    await this.ensureProjectMember(userId, projectId);

    const taskExport = await this.prisma.taskExport.create({
      data: {
        userId,
        projectId,
      },
    });

    await this.taskExportQueueService.addExportProjectTasksCsvJob({
      exportId: taskExport.id,
    });

    return taskExport;
  }

  async findAllByMember(
    userId: string,
    projectId: string,
    query: FindTaskExportsQueryDto,
  ): Promise<PaginatedResponse<TaskExport>> {
    await this.ensureProjectMember(userId, projectId);

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

  async findOneByMember(userId: string, projectId: string, id: string) {
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

  async remove(userId: string, projectId: string, id: string) {
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

  async download(userId: string, projectId: string, id: string) {
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
}
