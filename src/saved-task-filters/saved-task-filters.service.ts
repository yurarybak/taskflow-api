import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, SavedTaskFilter } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavedTaskFilterDto } from './dto/create-saved-task-filters.dto';
import { UpdateSavedTaskFilterDto } from './dto/update-saved-task-filters.dto';
import { WorkspaceAccessService } from '../workspace-access/workspace-access.service';

@Injectable()
export class SavedTaskFiltersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  private async findOneByMember(
    userId: string,
    projectId: string,
    id: string,
  ): Promise<SavedTaskFilter> {
    await this.workspaceAccessService.ensureProjectMember(projectId, userId);

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
  ): Promise<SavedTaskFilter> {
    await this.workspaceAccessService.ensureProjectMember(projectId, userId);

    return this.prisma.savedTaskFilter.create({
      data: {
        name: createSavedTaskFilterDto.name,
        filters: createSavedTaskFilterDto.filters as Prisma.InputJsonValue,
        userId,
        projectId,
      },
    });
  }

  async findAll(userId: string, projectId: string): Promise<SavedTaskFilter[]> {
    await this.workspaceAccessService.ensureProjectMember(projectId, userId);

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

  findOne(
    userId: string,
    projectId: string,
    id: string,
  ): Promise<SavedTaskFilter> {
    return this.findOneByMember(userId, projectId, id);
  }

  async update(
    userId: string,
    projectId: string,
    id: string,
    updateSavedTaskFilterDto: UpdateSavedTaskFilterDto,
  ): Promise<SavedTaskFilter> {
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

  async remove(userId: string, projectId: string, id: string): Promise<void> {
    await this.findOneByMember(userId, projectId, id);

    await this.prisma.savedTaskFilter.delete({
      where: {
        id,
      },
    });
  }
}
