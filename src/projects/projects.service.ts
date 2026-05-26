import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FindProjectsQueryDto } from './dto/find-projects-query.dto';
import { createPaginationMeta } from '../common/utils/create-pagination-meta';

import type { Prisma } from '../../generated/prisma/client';
import type { Project } from '../../generated/prisma/client';
import type { PaginatedResponse } from '../common/types/paginated-response.type';
@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) { }

  private async ensureWorkspaceOwner(ownerId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        ownerId: ownerId,
      },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
  }

  async create(
    ownerId: string,
    workspaceId: string,
    createProjectDto: CreateProjectDto,
  ) {
    await this.ensureWorkspaceOwner(ownerId, workspaceId);

    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        workspaceId,
      },
    });
  }

  async findAllByWorkspace(
    ownerId: string,
    workspaceId: string,
    query: FindProjectsQueryDto,
  ): Promise<PaginatedResponse<Project>> {
    await this.ensureWorkspaceOwner(ownerId, workspaceId);

    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      workspaceId,
      OR: query.search
        ? [
            {
              name: {
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

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.project.count({
        where,
      }),
    ]);

    return {
      data: projects,
      meta: createPaginationMeta(total, page, limit),
    };
  }

  async findOneByOwner(ownerId: string, projectId: string) {
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

  async update(
    ownerId: string,
    projectId: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    await this.findOneByOwner(ownerId, projectId);

    return this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: updateProjectDto,
    });
  }

  async remove(ownerId: string, projectId: string) {
    await this.findOneByOwner(ownerId, projectId);

    return this.prisma.project.delete({
      where: {
        id: projectId,
      },
    });
  }
}
