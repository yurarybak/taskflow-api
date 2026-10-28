import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceRole } from '../../generated/prisma/enums';

import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import type { WorkspaceMember, Label } from '../../generated/prisma/client';
import { WorkspaceAccessService } from '../workspace-access/workspace-access.service';

@Injectable()
export class LabelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  private async ensureWorkspaceRole(
    workspaceId: string,
    userId: string,
    allowedRoles: WorkspaceRole[],
  ): Promise<WorkspaceMember> {
    const membership = await this.workspaceAccessService.getWorkspaceMembership(
      workspaceId,
      userId,
    );

    if (!allowedRoles.includes(membership.role)) {
      throw new NotFoundException('Workspace not found');
    }

    return membership;
  }

  async create(
    workspaceId: string,
    userId: string,
    createLabelDto: CreateLabelDto,
  ): Promise<Label> {
    await this.ensureWorkspaceRole(workspaceId, userId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
    ]);

    const label = await this.prisma.label.findUnique({
      where: {
        workspaceId_name: {
          workspaceId,
          name: createLabelDto.name,
        },
      },
    });

    if (label) {
      throw new ConflictException('Label with this name already exists');
    }

    return this.prisma.label.create({
      data: {
        workspaceId,
        ...createLabelDto,
      },
    });
  }

  private async findOneByMember(
    workspaceId: string,
    userId: string,
    labelId: string,
  ): Promise<Label> {
    await this.workspaceAccessService.getWorkspaceMembership(
      workspaceId,
      userId,
    );

    const label = await this.prisma.label.findFirst({
      where: {
        id: labelId,
        workspaceId,
      },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    return label;
  }

  async update(
    workspaceId: string,
    userId: string,
    labelId: string,
    updateLabelDto: UpdateLabelDto,
  ): Promise<Label> {
    await this.ensureWorkspaceRole(workspaceId, userId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
    ]);

    await this.findOneByMember(workspaceId, userId, labelId);

    return this.prisma.label.update({
      where: {
        id: labelId,
      },
      data: updateLabelDto,
    });
  }

  async findAll(workspaceId: string, userId: string): Promise<Label[]> {
    await this.workspaceAccessService.getWorkspaceMembership(
      workspaceId,
      userId,
    );

    return this.prisma.label.findMany({
      where: {
        workspaceId,
      },
    });
  }

  async findOne(
    workspaceId: string,
    userId: string,
    labelId: string,
  ): Promise<Label> {
    return this.findOneByMember(workspaceId, userId, labelId);
  }

  async remove(
    workspaceId: string,
    userId: string,
    labelId: string,
  ): Promise<Label> {
    await this.ensureWorkspaceRole(workspaceId, userId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
    ]);

    await this.findOneByMember(workspaceId, userId, labelId);

    return this.prisma.label.delete({
      where: {
        id: labelId,
      },
    });
  }
}
