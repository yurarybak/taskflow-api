import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TaskActivityService } from '../task-activity/task-activity.service';
import { WorkspaceAccessService } from '../workspace-access/workspace-access.service';
import {
  TaskActivityType,
  TaskStatus,
  WorkspaceRole,
} from '../../generated/prisma/enums';
import { TaskNotificationsService } from './task-notifications.service';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  const tx = { task: { update: jest.fn() } };
  const prisma = {
    task: { findFirst: jest.fn(), delete: jest.fn() },
    $transaction: jest.fn(),
  };
  const taskActivityService = { create: jest.fn() };
  const taskNotificationsService = {
    notifyStatusChanged: jest.fn(),
    notifyAssigned: jest.fn(),
  };

  const givenTask = (
    overrides: { creatorId?: string; role?: WorkspaceRole } = {},
  ): void => {
    prisma.task.findFirst.mockResolvedValue({
      id: 't1',
      title: 'Fix login',
      projectId: 'p1',
      creatorId: overrides.creatorId ?? 'creator',
      status: TaskStatus.TODO,
      startDate: null,
      dueDate: null,
      originalEstimateMinutes: null,
      watchers: [{ userId: 'w1' }, { userId: 'w2' }],
      labels: [],
      project: {
        workspace: {
          members: [{ id: 'm1', role: overrides.role ?? WorkspaceRole.MEMBER }],
        },
      },
    });
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof tx) => unknown) => callback(tx),
    );
    tx.task.update.mockImplementation(({ data }: { data: object }) =>
      Promise.resolve({ id: 't1', projectId: 'p1', ...data }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prisma },
        { provide: TaskActivityService, useValue: taskActivityService },
        {
          provide: TaskNotificationsService,
          useValue: taskNotificationsService,
        },
        { provide: WorkspaceAccessService, useValue: {} },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('update', () => {
    it('hides the task from members who did not create it', async () => {
      givenTask({ creatorId: 'someone-else', role: WorkspaceRole.MEMBER });

      await expect(
        service.update('u1', 'p1', 't1', { title: 'New title' }),
      ).rejects.toThrow(NotFoundException);
      expect(tx.task.update).not.toHaveBeenCalled();
    });

    it.each([
      ['an admin', { creatorId: 'someone-else', role: WorkspaceRole.ADMIN }],
      ['the owner', { creatorId: 'someone-else', role: WorkspaceRole.OWNER }],
      ['the creator', { creatorId: 'u1', role: WorkspaceRole.MEMBER }],
    ])('lets %s update the task', async (_who, overrides) => {
      givenTask(overrides);

      await service.update('u1', 'p1', 't1', { title: 'New title' });

      expect(tx.task.update).toHaveBeenCalled();
    });

    it('records the status change and notifies watchers', async () => {
      givenTask({ creatorId: 'u1' });

      await service.update('u1', 'p1', 't1', {
        status: TaskStatus.IN_PROGRESS,
      });

      expect(taskActivityService.create).toHaveBeenCalledWith(
        {
          taskId: 't1',
          actorId: 'u1',
          type: TaskActivityType.STATUS_CHANGED,
          metadata: { from: TaskStatus.TODO, to: TaskStatus.IN_PROGRESS },
        },
        tx,
      );
      expect(taskNotificationsService.notifyStatusChanged).toHaveBeenCalledWith(
        'u1',
        ['w1', 'w2'],
        expect.objectContaining({ id: 't1' }),
      );
    });

    it('does not record anything when the status is unchanged', async () => {
      givenTask({ creatorId: 'u1' });

      await service.update('u1', 'p1', 't1', { status: TaskStatus.TODO });

      expect(taskActivityService.create).not.toHaveBeenCalled();
      expect(
        taskNotificationsService.notifyStatusChanged,
      ).not.toHaveBeenCalled();
    });

    it('rejects a start date after the due date', async () => {
      givenTask({ creatorId: 'u1' });

      await expect(
        service.update('u1', 'p1', 't1', {
          startDate: '2026-02-01T00:00:00.000Z',
          dueDate: '2026-01-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('archive', () => {
    it('sets archivedAt and records TASK_ARCHIVED in one transaction', async () => {
      givenTask();

      const task = await service.archive('u1', 't1');

      expect(task).toMatchObject({ archivedAt: expect.any(Date) as unknown });
      expect(taskActivityService.create).toHaveBeenCalledWith(
        { taskId: 't1', actorId: 'u1', type: TaskActivityType.TASK_ARCHIVED },
        tx,
      );
    });
  });

  describe('remove', () => {
    it('does not let a member delete a task created by someone else', async () => {
      givenTask({ creatorId: 'someone-else', role: WorkspaceRole.MEMBER });

      await expect(service.remove('u1', 't1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });

    it('deletes the task for its creator', async () => {
      givenTask({ creatorId: 'u1' });

      await service.remove('u1', 't1');

      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    });
  });
});
