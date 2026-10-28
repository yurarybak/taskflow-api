import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskActivityService } from '../task-activity/task-activity.service';
import { NotificationsQueueService } from '../queues/notifications-queue/notifications-queue.service';
import {
  TaskActivityType,
  NotificationType,
} from '../../generated/prisma/enums';
import type { TaskWatcher, User } from '../../generated/prisma/client';
import type { TaskWatcherWithUser } from './types/task-watcher-with-user.type';
import { WorkspaceAccessService } from '../workspace-access/workspace-access.service';

@Injectable()
export class TaskWatchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskActivityService: TaskActivityService,
    private readonly notificationsQueueService: NotificationsQueueService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  private findWatcher(
    taskId: string,
    userId: string,
  ): Promise<TaskWatcher | null> {
    return this.prisma.taskWatcher.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });
  }

  async findAllByTask(
    userId: string,
    taskId: string,
  ): Promise<
    (TaskWatcher & { user: Pick<User, 'id' | 'firstName' | 'lastName'> })[]
  > {
    await this.workspaceAccessService.ensureTaskMember(taskId, userId);

    return this.prisma.taskWatcher.findMany({
      where: {
        taskId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  private async createWatcherAddedNotification(
    userId: string,
    watcherId: string,
    task: {
      id: string;
      title: string;
      projectId: string;
    },
  ): Promise<void> {
    if (userId === watcherId) {
      return;
    }

    await this.notificationsQueueService.addCreateNotificationJob({
      userId: watcherId,
      type: NotificationType.WATCHER_ADDED,
      title: 'You were added as a watcher',
      message: task.title,
      data: {
        taskId: task.id,
        projectId: task.projectId,
      },
    });
  }

  async addWatcher(
    actorId: string,
    taskId: string,
    watcherUserId: string,
  ): Promise<TaskWatcherWithUser> {
    const [task] = await Promise.all([
      this.workspaceAccessService.ensureTaskMember(taskId, actorId),
      this.workspaceAccessService.ensureTaskMember(taskId, watcherUserId),
    ]);

    const existingWatcher = await this.findWatcher(taskId, watcherUserId);

    if (existingWatcher) {
      throw new ConflictException('User is already watching this task');
    }

    return this.prisma.$transaction(async (tx) => {
      const createdWatcher = await tx.taskWatcher.create({
        data: {
          taskId,
          userId: watcherUserId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      await this.taskActivityService.create(
        {
          actorId,
          taskId,
          type: TaskActivityType.WATCHER_ADDED,
          metadata: {
            watcherUserId,
          },
        },
        tx,
      );

      await this.createWatcherAddedNotification(actorId, watcherUserId, task);

      return createdWatcher;
    });
  }

  async removeWatcher(
    actorId: string,
    taskId: string,
    watcherUserId: string,
  ): Promise<void> {
    await Promise.all([
      this.workspaceAccessService.ensureTaskMember(taskId, actorId),
      this.workspaceAccessService.ensureTaskMember(taskId, watcherUserId),
    ]);

    const existingWatcher = await this.findWatcher(taskId, watcherUserId);

    if (!existingWatcher) {
      throw new NotFoundException('Watcher was not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.taskWatcher.delete({
        where: {
          taskId_userId: {
            taskId,
            userId: watcherUserId,
          },
        },
      });

      await this.taskActivityService.create(
        {
          actorId,
          taskId,
          type: TaskActivityType.WATCHER_REMOVED,
          metadata: {
            watcherUserId,
          },
        },
        tx,
      );
    });
  }

  addMe(actorId: string, taskId: string): Promise<TaskWatcherWithUser> {
    return this.addWatcher(actorId, taskId, actorId);
  }

  removeMe(actorId: string, taskId: string): Promise<void> {
    return this.removeWatcher(actorId, taskId, actorId);
  }
}
