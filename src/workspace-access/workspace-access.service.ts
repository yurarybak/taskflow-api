import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import type {
  Project,
  Task,
  Workspace,
  WorkspaceMember,
} from '../../generated/prisma/client';

/**
 * Membership checks shared by workspace-scoped resources.
 * Non-members get NotFoundException so the existence of a resource is not revealed.
 */
@Injectable()
export class WorkspaceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspaceMembership(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember> {
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

  async ensureWorkspaceMember(
    workspaceId: string,
    userId: string,
  ): Promise<Workspace> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        members: {
          some: {
            userId,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async ensureProjectMember(
    projectId: string,
    userId: string,
  ): Promise<Project> {
    const project = await this.findProjectForMember(projectId, userId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async isProjectMember(projectId: string, userId: string): Promise<boolean> {
    const project = await this.findProjectForMember(projectId, userId);

    return project !== null;
  }

  async ensureTaskMember(
    taskId: string,
    userId: string,
    projectId?: string,
  ): Promise<Task> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        ...(projectId && { projectId }),
        project: {
          workspace: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private findProjectForMember(
    projectId: string,
    userId: string,
  ): Promise<Project | null> {
    return this.prisma.project.findFirst({
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
  }
}
