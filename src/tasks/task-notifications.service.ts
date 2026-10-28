import { Injectable } from '@nestjs/common';
import { NotificationsQueueService } from '../queues/notifications-queue/notifications-queue.service';
import { NotificationType } from '../../generated/prisma/enums';

import type { Task } from '../../generated/prisma/client';

type NotifiableTask = Pick<Task, 'id' | 'title' | 'projectId'>;

/** Decides who is notified about task changes; the actor is never notified about their own action. */
@Injectable()
export class TaskNotificationsService {
  constructor(
    private readonly notificationsQueueService: NotificationsQueueService,
  ) {}

  async notifyAssigned(
    actorId: string,
    assigneeId: string | null,
    task: NotifiableTask,
  ): Promise<void> {
    if (!assigneeId || actorId === assigneeId) {
      return;
    }

    await this.notificationsQueueService.addCreateNotificationJob({
      userId: assigneeId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'You were assigned to a task',
      message: task.title,
      data: {
        taskId: task.id,
        projectId: task.projectId,
      },
    });
  }

  async notifyStatusChanged(
    actorId: string,
    watcherIds: string[],
    task: NotifiableTask,
  ): Promise<void> {
    const recipientIds = watcherIds.filter(
      (watcherId) => watcherId !== actorId,
    );

    await Promise.all(
      recipientIds.map((recipientId) =>
        this.notificationsQueueService.addCreateNotificationJob({
          userId: recipientId,
          type: NotificationType.TASK_STATUS_CHANGED,
          title: 'Task status was changed',
          message: task.title,
          data: {
            taskId: task.id,
            projectId: task.projectId,
          },
        }),
      ),
    );
  }
}
