import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskActivityService } from '../task-activity/task-activity.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  TaskActivityType,
  NotificationType,
} from '../../generated/prisma/enums';
import { PrismaTransactionClient } from '../prisma/types/prisma-transaction-client.type';

@Injectable()
export class TaskWatchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskActivityService: TaskActivityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async ensureUserCanAccessTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
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

  private findWatcher(taskId: string, userId: string) {
    return this.prisma.taskWatcher.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });
  }

  async findAllByTask(userId: string, taskId: string) {
    await this.ensureUserCanAccessTask(taskId, userId);

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
    tx: PrismaTransactionClient,
  ) {
    if (userId === watcherId) {
      return;
    }

    await this.notificationsService.create(
      {
        userId: watcherId,
        type: NotificationType.WATCHER_ADDED,
        title: 'You were added as a watcher',
        message: task.title,
        data: {
          taskId: task.id,
          projectId: task.projectId,
        },
      },
      tx,
    );
  }

  async addWatcher(actorId: string, taskId: string, watcherUserId: string) {
    const [task] = await Promise.all([
      this.ensureUserCanAccessTask(taskId, actorId),
      this.ensureUserCanAccessTask(taskId, watcherUserId),
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

      await this.createWatcherAddedNotification(
        actorId,
        watcherUserId,
        task,
        tx,
      );

      return createdWatcher;
    });
  }

  async removeWatcher(actorId: string, taskId: string, watcherUserId: string) {
    await Promise.all([
      this.ensureUserCanAccessTask(taskId, actorId),
      this.ensureUserCanAccessTask(taskId, watcherUserId),
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

  addMe(actorId: string, taskId: string) {
    return this.addWatcher(actorId, taskId, actorId);
  }

  removeMe(actorId: string, taskId: string) {
    return this.removeWatcher(actorId, taskId, actorId);
  }
}
