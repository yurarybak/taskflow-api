import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavedTaskFilterDto } from './dto/create-saved-task-filters.dto';
import { UpdateSavedTaskFilterDto } from './dto/update-saved-task-filters.dto';

@Injectable()
export class SavedTaskFiltersService {
  constructor(private readonly prisma: PrismaService) {}

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

  private async findOneByMember(userId: string, projectId: string, id: string) {
    await this.ensureProjectMember(userId, projectId);

    const filter = await this.prisma.savedTaskFilter.findFirst({
      where: {
        id,
        userId,
        projectId,
      },
    });

    if (!filter) {
      throw new NotFoundException('Saved task filter was not found');
    }

    return filter;
  }

  async create(
    userId: string,
    projectId: string,
    createSavedTaskFilterDto: CreateSavedTaskFilterDto,
  ) {
    await this.ensureProjectMember(userId, projectId);

    return this.prisma.savedTaskFilter.create({
      data: {
        name: createSavedTaskFilterDto.name,
        filters: createSavedTaskFilterDto.filters as Prisma.InputJsonValue,
        userId,
        projectId,
      },
    });
  }

  async findAll(userId: string, projectId: string) {
    await this.ensureProjectMember(userId, projectId);

    return this.prisma.savedTaskFilter.findMany({
      where: {
        userId,
        projectId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  findOne(userId: string, projectId: string, id: string) {
    return this.findOneByMember(userId, projectId, id);
  }

  async update(
    userId: string,
    projectId: string,
    id: string,
    updateSavedTaskFilterDto: UpdateSavedTaskFilterDto,
  ) {
    await this.findOneByMember(userId, projectId, id);

    return this.prisma.savedTaskFilter.update({
      where: {
        id,
        userId,
        projectId,
      },
      data: {
        name: updateSavedTaskFilterDto.name,
        filters: updateSavedTaskFilterDto.filters as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
  }

  async remove(userId: string, projectId: string, id: string) {
    await this.findOneByMember(userId, projectId, id);

    await this.prisma.savedTaskFilter.delete({
      where: {
        id,
      },
    });
  }
}
