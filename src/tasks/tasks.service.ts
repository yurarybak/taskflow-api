import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto';
import { createPaginationMeta } from '../common/utils/create-pagination-meta';

import type { Prisma } from '../../generated/prisma/client';
import type { PaginatedResponse } from '../common/types/paginated-response.type';
import type { Task } from '../../generated/prisma/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) { }

  private async ensureProjectOwner(ownerId: string, projectId: string) {
    console.log('ownerId', ownerId);

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspace: {
          ownerId,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(
    creatorId: string,
    projectId: string,
    createTaskDto: CreateTaskDto,
  ) {
    await this.ensureProjectOwner(creatorId, projectId);

    return this.prisma.task.create({
      data: {
        ...createTaskDto,
        projectId,
        creatorId,
      },
    });
  }

  update(taskId: string, updateTaskDto: UpdateTaskDto) {
    return this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        ...updateTaskDto,
      },
    });
  }

  findOneByProjectOwner(creatorId: string, taskId: string) {
    return this.prisma.task.findFirst({
      where: {
        id: taskId,
        creatorId,
      },
    });
  }

  async findAllByProject(
    creatorId: string,
    projectId: string,
    query: FindTasksQueryDto,
  ): Promise<PaginatedResponse<Task>> {
    await this.ensureProjectOwner(creatorId, projectId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      projectId,
      creatorId,
      status: query.status,
      priority: query.priority,
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

  remove(taskId: string) {
    return this.prisma.task.delete({
      where: {
        id: taskId,
      },
    });
  }
}
