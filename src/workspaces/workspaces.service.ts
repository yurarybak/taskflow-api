import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
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

  async findMembers(ownerId: string, workspaceId: string) {
    await this.findOneByOwner(ownerId, workspaceId); // Ensure workspace exists and belongs to the owner

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
}
