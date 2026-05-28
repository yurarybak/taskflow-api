import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto';
import { WorkspaceRole } from '../../generated/prisma/enums';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  create(ownerId: string, createWorkspaceDto: CreateWorkspaceDto) {
    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          ...createWorkspaceDto,
          ownerId,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: ownerId,
          role: WorkspaceRole.OWNER,
        },
      });

      return workspace;
    });
  }

  findAllByOwner(ownerId: string) {
    return this.prisma.workspace.findMany({
      where: {
        ownerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOneByOwner(ownerId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        ownerId,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  update(
    ownerId: string,
    workspaceId: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.prisma.workspace.update({
      where: {
        id: workspaceId,
        ownerId,
      },
      data: updateWorkspaceDto,
    });
  }

  async remove(ownerId: string, workspaceId: string) {
    await this.ensureWorkspaceRole(workspaceId, ownerId, [WorkspaceRole.OWNER]);

    return this.prisma.workspace.delete({
      where: {
        id: workspaceId,
        ownerId,
      },
    });
  }

  async findMembers(userId: string, workspaceId: string) {
    // Ensure workspace exists and belongs to the user
    await this.ensureWorkspaceMember(workspaceId, userId);

    return this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async addMember(
    ownerId: string,
    workspaceId: string,
    addWorkspaceMemberDto: AddWorkspaceMemberDto,
  ) {
    const membership = await this.ensureWorkspaceRole(workspaceId, ownerId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
    ]);

    const role = addWorkspaceMemberDto.role ?? WorkspaceRole.MEMBER;

    if (
      membership.role === WorkspaceRole.ADMIN &&
      role !== WorkspaceRole.MEMBER
    ) {
      throw new ConflictException('Admins cannot add owners to the workspace');
    }

    // Find the user by email
    const member = await this.prisma.user.findUnique({
      where: {
        email: addWorkspaceMemberDto.email,
      },
    });

    if (!member) {
      throw new NotFoundException('User not found');
    }

    // Check if the user is already a member of the workspace
    const existingMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: member.id,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of the workspace');
    }

    // Add the user as a member of the workspace
    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: member.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

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
      throw new NotFoundException('Workspace member not found');
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

  async updateMember(
    userId: string,
    workspaceId: string,
    memberId: string,
    updateWorkspaceMemberDto: UpdateWorkspaceMemberDto,
  ) {
    // Only owners can update member roles
    await this.ensureWorkspaceRole(workspaceId, userId, [WorkspaceRole.OWNER]);

    // Check if the member exists and belongs to the workspace
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: memberId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }

    if (member.role === WorkspaceRole.OWNER) {
      throw new ConflictException('Cannot change role of the owner');
    }

    // Update the member's role
    return this.prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: memberId,
        },
      },
      data: {
        role: updateWorkspaceMemberDto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async removeMember(userId: string, workspaceId: string, memberId: string) {
    const requesterMembership = await this.ensureWorkspaceRole(
      workspaceId,
      userId,
      [WorkspaceRole.OWNER, WorkspaceRole.ADMIN],
    );

    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: memberId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }

    if (member.role === WorkspaceRole.OWNER) {
      throw new ConflictException('Cannot remove the owner from the workspace');
    }

    if (
      requesterMembership.role === WorkspaceRole.ADMIN &&
      member.role !== WorkspaceRole.MEMBER
    ) {
      throw new ConflictException(
        'Admins cannot remove other admins or the owner from the workspace',
      );
    }

    return this.prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: memberId,
        },
      },
    });
  }
}
