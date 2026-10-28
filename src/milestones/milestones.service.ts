import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import type { Milestone } from '../../generated/prisma/client';
import { WorkspaceAccessService } from '../workspace-access/workspace-access.service';

@Injectable()
export class MilestonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  private async findOneByMember(
    userId: string,
    projectId: string,
    milestoneId: string,
  ): Promise<Milestone> {
    await this.workspaceAccessService.ensureProjectMember(projectId, userId);

    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id: milestoneId,
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone was not found');
    }

    return milestone;
  }

  private validateMilestoneDates(
    startDate?: string | Date | null,
    dueDate?: string | Date | null,
  ): void {
    if (!startDate || !dueDate) {
      return;
    }

    if (new Date(startDate) > new Date(dueDate)) {
      throw new BadRequestException('Start date cannot be later than due date');
    }
  }

  async create(
    userId: string,
    projectId: string,
    createMilestoneDto: CreateMilestoneDto,
  ): Promise<Milestone> {
    await this.workspaceAccessService.ensureProjectMember(projectId, userId);

    this.validateMilestoneDates(
      createMilestoneDto.startDate,
      createMilestoneDto.dueDate,
    );

    const milestone = await this.prisma.milestone.create({
      data: {
        projectId,
        ...createMilestoneDto,
      },
    });

    return milestone;
  }

  async findAll(userId: string, projectId: string): Promise<Milestone[]> {
    await this.workspaceAccessService.ensureProjectMember(projectId, userId);

    return this.prisma.milestone.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(
    userId: string,
    projectId: string,
    milestoneId: string,
  ): Promise<Milestone> {
    return this.findOneByMember(userId, projectId, milestoneId);
  }

  async update(
    userId: string,
    projectId: string,
    milestoneId: string,
    updateMilestoneDto: UpdateMilestoneDto,
  ): Promise<Milestone> {
    await this.workspaceAccessService.ensureProjectMember(projectId, userId);
    const milestone = await this.findOneByMember(
      userId,
      projectId,
      milestoneId,
    );

    const nextStartDate =
      updateMilestoneDto.startDate !== undefined
        ? updateMilestoneDto.startDate
        : milestone.startDate;

    const nextDueDate =
      updateMilestoneDto.dueDate !== undefined
        ? updateMilestoneDto.dueDate
        : milestone.dueDate;

    this.validateMilestoneDates(nextStartDate, nextDueDate);

    return this.prisma.milestone.update({
      where: {
        id: milestoneId,
      },
      data: updateMilestoneDto,
    });
  }

  async remove(
    userId: string,
    projectId: string,
    milestoneId: string,
  ): Promise<void> {
    await this.workspaceAccessService.ensureProjectMember(projectId, userId);

    await this.prisma.milestone.delete({
      where: {
        id: milestoneId,
      },
    });
  }

  async complete(
    userId: string,
    projectId: string,
    milestoneId: string,
  ): Promise<void> {
    await this.workspaceAccessService.ensureProjectMember(projectId, userId);

    await this.prisma.milestone.update({
      where: {
        id: milestoneId,
      },
      data: {
        completedAt: new Date(),
      },
    });
  }

  async reopen(
    userId: string,
    projectId: string,
    milestoneId: string,
  ): Promise<void> {
    await this.workspaceAccessService.ensureProjectMember(projectId, userId);

    await this.prisma.milestone.update({
      where: {
        id: milestoneId,
      },
      data: {
        completedAt: null,
      },
    });
  }
}
