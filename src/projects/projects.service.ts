import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findAllByWorkspace(ownerId: string, workspaceId: string) {
    await this.ensureWorkspaceOwner(ownerId, workspaceId);

    return this.prisma.project.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOneByWorkspace(
    ownerId: string,
    workspaceId: string,
    projectId: string,
  ) {
    await this.ensureWorkspaceOwner(ownerId, workspaceId);

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }
}
