import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TaskExportQueueService } from '../queues/task-export-queue/task-export-queue.service';
import { TaskExportStatus } from '../../generated/prisma/enums';
import { TaskExportsService } from './task-exports.service';

describe('TaskExportsService', () => {
  let service: TaskExportsService;
  const calls: string[] = [];
  const prisma = {
    taskExport: { findFirst: jest.fn(), update: jest.fn() },
  };
  const queue = {
    addExportProjectTasksCsvJob: jest.fn(),
    removeJob: jest.fn(),
  };

  const givenExport = (status: TaskExportStatus, jobId = 'job-1'): void => {
    prisma.taskExport.findFirst.mockResolvedValue({ id: 'e1', status, jobId });
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    calls.length = 0;
    prisma.taskExport.update.mockImplementation(() => {
      calls.push('db:update');
      return Promise.resolve({});
    });
    queue.addExportProjectTasksCsvJob.mockImplementation(() => {
      calls.push('queue:add');
      return Promise.resolve();
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskExportsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TaskExportQueueService, useValue: queue },
      ],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get<TaskExportsService>(TaskExportsService);
  });

  it('only finds exports owned by the user in the project', async () => {
    prisma.taskExport.findFirst.mockResolvedValue(null);

    await expect(service.findOneByMember('u1', 'p1', 'e1')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.taskExport.findFirst).toHaveBeenCalledWith({
      where: { id: 'e1', userId: 'u1', projectId: 'p1' },
    });
  });

  describe('cancel', () => {
    it.each([TaskExportStatus.PENDING, TaskExportStatus.PROCESSING])(
      'cancels a %s export and removes its job',
      async (status) => {
        givenExport(status);

        await service.cancel('u1', 'p1', 'e1');

        expect(queue.removeJob).toHaveBeenCalledWith('job-1');
        expect(prisma.taskExport.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: TaskExportStatus.CANCELLED,
            }) as unknown,
          }),
        );
      },
    );

    it('still cancels when the job is locked by a running worker', async () => {
      givenExport(TaskExportStatus.PROCESSING);
      queue.removeJob.mockRejectedValue(new Error('Job is locked'));

      await expect(service.cancel('u1', 'p1', 'e1')).resolves.toBeUndefined();
      expect(prisma.taskExport.update).toHaveBeenCalled();
    });

    it.each([
      TaskExportStatus.COMPLETED,
      TaskExportStatus.FAILED,
      TaskExportStatus.CANCELLED,
    ])('rejects cancelling a %s export', async (status) => {
      givenExport(status);

      await expect(service.cancel('u1', 'p1', 'e1')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.taskExport.update).not.toHaveBeenCalled();
    });
  });

  describe('retry', () => {
    it.each([TaskExportStatus.FAILED, TaskExportStatus.CANCELLED])(
      'resets a %s export before queueing a new job',
      async (status) => {
        givenExport(status);

        await service.retry('u1', 'p1', 'e1');

        expect(calls).toEqual(['db:update', 'queue:add']);
        expect(prisma.taskExport.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: TaskExportStatus.PENDING,
              progress: 0,
            }) as unknown,
          }),
        );
      },
    );

    it('marks the export as failed when queueing fails', async () => {
      givenExport(TaskExportStatus.FAILED);
      queue.addExportProjectTasksCsvJob.mockRejectedValue(
        new Error('Redis down'),
      );

      await expect(service.retry('u1', 'p1', 'e1')).rejects.toThrow(
        'Redis down',
      );
      expect(prisma.taskExport.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: TaskExportStatus.FAILED,
          }) as unknown,
        }),
      );
    });

    it.each([
      TaskExportStatus.PENDING,
      TaskExportStatus.PROCESSING,
      TaskExportStatus.COMPLETED,
    ])('rejects retrying a %s export', async (status) => {
      givenExport(status);

      await expect(service.retry('u1', 'p1', 'e1')).rejects.toThrow(
        BadRequestException,
      );
      expect(queue.addExportProjectTasksCsvJob).not.toHaveBeenCalled();
    });
  });
});
