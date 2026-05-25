import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  create(ownerId: string, createWorkspaceDto: CreateWorkspaceDto) {
    return this.prisma.workspace.create({
      data: {
        ...createWorkspaceDto,
        ownerId,
      },
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
}
