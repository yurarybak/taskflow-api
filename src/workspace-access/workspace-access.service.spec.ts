import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceAccessService } from './workspace-access.service';

describe('WorkspaceAccessService', () => {
  let service: WorkspaceAccessService;
  const prisma = {
    workspaceMember: { findUnique: jest.fn() },
    workspace: { findFirst: jest.fn() },
    project: { findFirst: jest.fn() },
    task: { findFirst: jest.fn() },
  };

  const memberOf = (userId: string): object => ({
    workspace: { members: { some: { userId } } },
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceAccessService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WorkspaceAccessService>(WorkspaceAccessService);
  });

  describe('getWorkspaceMembership', () => {
    it('returns the membership of the user', async () => {
      const membership = { id: 'm1', role: 'MEMBER' };
      prisma.workspaceMember.findUnique.mockResolvedValue(membership);

      await expect(service.getWorkspaceMembership('w1', 'u1')).resolves.toBe(
        membership,
      );
      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: { workspaceId_userId: { workspaceId: 'w1', userId: 'u1' } },
      });
    });

    it('throws NotFoundException for non-members', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.getWorkspaceMembership('w1', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('ensureWorkspaceMember', () => {
    it('scopes the workspace lookup to its members', async () => {
      const workspace = { id: 'w1' };
      prisma.workspace.findFirst.mockResolvedValue(workspace);

      await expect(service.ensureWorkspaceMember('w1', 'u1')).resolves.toBe(
        workspace,
      );
      expect(prisma.workspace.findFirst).toHaveBeenCalledWith({
        where: { id: 'w1', members: { some: { userId: 'u1' } } },
      });
    });

    it('throws NotFoundException for non-members', async () => {
      prisma.workspace.findFirst.mockResolvedValue(null);

      await expect(service.ensureWorkspaceMember('w1', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('ensureProjectMember', () => {
    it('returns the project when the user is a workspace member', async () => {
      const project = { id: 'p1' };
      prisma.project.findFirst.mockResolvedValue(project);

      await expect(service.ensureProjectMember('p1', 'u1')).resolves.toBe(
        project,
      );
      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'p1', ...memberOf('u1') },
      });
    });

    it('throws NotFoundException for non-members', async () => {
      prisma.project.findFirst.mockResolvedValue(null);

      await expect(service.ensureProjectMember('p1', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('isProjectMember', () => {
    it('returns true when the project is found for the user', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: 'p1' });

      await expect(service.isProjectMember('p1', 'u1')).resolves.toBe(true);
    });

    it('returns false instead of throwing for non-members', async () => {
      prisma.project.findFirst.mockResolvedValue(null);

      await expect(service.isProjectMember('p1', 'u1')).resolves.toBe(false);
    });
  });

  describe('ensureTaskMember', () => {
    it('scopes the task lookup to workspace members', async () => {
      const task = { id: 't1' };
      prisma.task.findFirst.mockResolvedValue(task);

      await expect(service.ensureTaskMember('t1', 'u1')).resolves.toBe(task);
      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: { id: 't1', project: memberOf('u1') },
      });
    });

    it('also filters by project when projectId is given', async () => {
      prisma.task.findFirst.mockResolvedValue({ id: 't1' });

      await service.ensureTaskMember('t1', 'u1', 'p1');

      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: { id: 't1', projectId: 'p1', project: memberOf('u1') },
      });
    });

    it('throws NotFoundException for non-members', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(service.ensureTaskMember('t1', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
