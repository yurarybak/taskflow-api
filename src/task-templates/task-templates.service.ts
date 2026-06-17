import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskTemplateDto } from './dto/create-task-template.dto';
import { UpdateTaskTemplateDto } from './dto/update-task-template.dto';
import { FindTaskTemplatesQueryDto } from './dto/find-task-templates-query.dto';

@Injectable()
export class TaskTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureWorkspaceMember(userId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        members: {
          some: {
            userId,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace was not found');
    }

    return workspace;
  }

  private async findOneById(id: string) {
    const taskTemplate = await this.prisma.taskTemplate.findFirst({
      where: {
        id,
      },
      include: {
        labels: true,
      },
    });

    if (!taskTemplate) {
      throw new NotFoundException('Task template was not found');
    }

    return taskTemplate;
  }

  private async ensureLabelsBelongToWorkspace(
    workspaceId: string,
    labelIds: string[] = [],
  ) {
    if (!labelIds.length) {
      return;
    }

    const uniqueLabelIds = [...new Set(labelIds)];

    const count = await this.prisma.label.count({
      where: {
        id: {
          in: uniqueLabelIds,
        },
        workspaceId,
      },
    });

    if (count !== uniqueLabelIds.length) {
      throw new NotFoundException('One or more labels were not found');
    }
  }

  async create(
    userId: string,
    workspaceId: string,
    createTaskTemplateDto: CreateTaskTemplateDto,
  ) {
    await this.ensureWorkspaceMember(userId, workspaceId);

    await this.ensureLabelsBelongToWorkspace(
      workspaceId,
      createTaskTemplateDto.labelIds,
    );

    return this.prisma.taskTemplate.create({
      data: {
        workspaceId,
        name: createTaskTemplateDto.name,
        title: createTaskTemplateDto.title,
        description: createTaskTemplateDto.description,
        type: createTaskTemplateDto.type,
        priority: createTaskTemplateDto.priority,
        labels: {
          connect: createTaskTemplateDto.labelIds?.map((labelId) => ({
            id: labelId,
          })),
        },
      },
    });
  }

  async findAll(
    userId: string,
    workspaceId: string,
    query: FindTaskTemplatesQueryDto,
  ) {
    await this.ensureWorkspaceMember(userId, workspaceId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = page * limit - limit;

    return this.prisma.taskTemplate.findMany({
      where: {
        workspaceId,
      },
      take: limit,
      skip,
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        labels: true,
      },
    });
  }

  async findOne(userId: string, workspaceId: string, id: string) {
    await this.ensureWorkspaceMember(userId, workspaceId);

    return this.findOneById(id);
  }

  async update(
    userId: string,
    workspaceId: string,
    id: string,
    updateTaskTemplateDto: UpdateTaskTemplateDto,
  ) {
    await this.ensureWorkspaceMember(userId, workspaceId);

    await this.findOneById(id);

    await this.ensureLabelsBelongToWorkspace(
      workspaceId,
      updateTaskTemplateDto.labelIds,
    );

    return this.prisma.taskTemplate.update({
      where: {
        id,
      },
      data: {
        name: updateTaskTemplateDto.name,
        title: updateTaskTemplateDto.title,
        description: updateTaskTemplateDto.description,
        type: updateTaskTemplateDto.type,
        priority: updateTaskTemplateDto.priority,
        ...(updateTaskTemplateDto.labelIds && {
          labels: {
            set: updateTaskTemplateDto.labelIds.map((labelId) => ({
              id: labelId,
            })),
          },
        }),
      },
      include: {
        labels: true,
      },
    });
  }

  async remove(userId: string, workspaceId: string, id: string) {
    await this.ensureWorkspaceMember(userId, workspaceId);

    await this.findOneById(id);

    await this.prisma.taskTemplate.delete({
      where: {
        id,
      },
    });
  }
}
