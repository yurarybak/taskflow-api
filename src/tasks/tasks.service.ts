import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

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

  async findAllByProject(creatorId: string, projectId: string) {
    await this.ensureProjectOwner(creatorId, projectId);

    return this.prisma.task.findMany({
      where: {
        projectId,
        creatorId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  remove(taskId: string) {
    return this.prisma.task.delete({
      where: {
        id: taskId,
      },
    });
  }
}
