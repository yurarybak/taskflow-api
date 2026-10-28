import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsQueueService } from '../queues/notifications-queue/notifications-queue.service';
import { NotificationType } from '../../generated/prisma/enums';
import { TaskNotificationsService } from './task-notifications.service';

describe('TaskNotificationsService', () => {
  let service: TaskNotificationsService;
  const queue = { addCreateNotificationJob: jest.fn() };
  const task = { id: 't1', title: 'Fix login', projectId: 'p1' };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskNotificationsService,
        { provide: NotificationsQueueService, useValue: queue },
      ],
    }).compile();

    service = module.get<TaskNotificationsService>(TaskNotificationsService);
  });

  describe('notifyAssigned', () => {
    it('queues a TASK_ASSIGNED notification for the assignee', async () => {
      await service.notifyAssigned('actor', 'assignee', task);

      expect(queue.addCreateNotificationJob).toHaveBeenCalledWith({
        userId: 'assignee',
        type: NotificationType.TASK_ASSIGNED,
        title: 'You were assigned to a task',
        message: 'Fix login',
        data: { taskId: 't1', projectId: 'p1' },
      });
    });

    it('skips self-assignment and unassignment', async () => {
      await service.notifyAssigned('actor', 'actor', task);
      await service.notifyAssigned('actor', null, task);

      expect(queue.addCreateNotificationJob).not.toHaveBeenCalled();
    });
  });

  describe('notifyStatusChanged', () => {
    it('notifies every watcher except the actor', async () => {
      await service.notifyStatusChanged('actor', ['w1', 'actor', 'w2'], task);

      const recipients = queue.addCreateNotificationJob.mock.calls.map(
        ([job]: [{ userId: string }]) => job.userId,
      );
      expect(recipients).toEqual(['w1', 'w2']);
    });
  });
});
