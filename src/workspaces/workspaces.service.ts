import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';
import { WorkspaceRole } from '../../generated/prisma/enums';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) { }

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

  remove(ownerId: string, workspaceId: string) {
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
    // Ensure workspace exists and belongs to the owner
    await this.findOneByOwner(ownerId, workspaceId);

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
        role: addWorkspaceMemberDto.role || WorkspaceRole.MEMBER,
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
}
