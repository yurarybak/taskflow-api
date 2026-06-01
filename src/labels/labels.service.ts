import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceRole } from '../../generated/prisma/enums';

import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Injectable()
export class LabelsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureWorkspaceMember(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Workspace not found');
    }

    return membership;
  }

  private async ensureWorkspaceRole(
    workspaceId: string,
    userId: string,
    allowedRoles: WorkspaceRole[],
  ) {
    const membership = await this.ensureWorkspaceMember(workspaceId, userId);

    if (!allowedRoles.includes(membership.role)) {
      throw new NotFoundException('Workspace not found');
    }

    return membership;
  }

  async create(
    workspaceId: string,
    userId: string,
    createLabelDto: CreateLabelDto,
  ) {
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
  ) {
    await this.ensureWorkspaceMember(workspaceId, userId);

    const label = await this.prisma.label.findFirst({
      where: {
        id: labelId,
        workspaceId,
      },
    });

    if (label) {
      throw new NotFoundException('Label not found');
    }
  }

  async update(
    workspaceId: string,
    userId: string,
    labelId: string,
    updateLabelDto: UpdateLabelDto,
  ) {
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

  async findAll(workspaceId: string, userId: string) {
    await this.ensureWorkspaceMember(workspaceId, userId);

    return this.prisma.label.findMany({
      where: {
        workspaceId,
      },
    });
  }

  async findOne(workspaceId: string, userId: string, labelId: string) {
    return this.findOneByMember(workspaceId, userId, labelId);
  }

  async remove(workspaceId: string, userId: string, labelId: string) {
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
