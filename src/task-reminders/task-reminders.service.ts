import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { NotificationType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsQueueService } from '../queues/notifications-queue/notifications-queue.service';

import { CreateTaskReminderDto } from './dto/create-task-reminder.dto';
import { UpdateTaskReminderDto } from './dto/update-task-reminder.dto';

@Injectable()
export class TaskRemindersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsQueueService: NotificationsQueueService,
  ) {}

  private async ensureTaskMember(taskId: string, userId: string) {
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

  async sendReminder(reminderId: string) {
    const reminder = await this.prisma.taskReminder.findUnique({
      where: {
        id: reminderId,
      },
      include: {
        task: true,
      },
    });

    if (!reminder || reminder.sentAt) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.notification.create({
        data: {
          userId: reminder.userId,
          type: NotificationType.TASK_REMINDER,
          title: 'Task reminder',
          message: reminder.task.title,
          data: {
            taskId: reminder.taskId,
            projectId: reminder.task.projectId,
            reminderId: reminder.id,
          },
        },
      });

      await tx.taskReminder.update({
        where: {
          id: reminder.id,
        },
        data: {
          sentAt: new Date(),
        },
      });
    });
  }

  async create(
    taskId: string,
    userId: string,
    createTaskReminderDto: CreateTaskReminderDto,
  ) {
    const remindAt = new Date(createTaskReminderDto.remindAt);

    if (remindAt.getTime() <= Date.now()) {
      throw new BadRequestException('Reminder date must be in the future');
    }

    await this.ensureTaskMember(taskId, userId);

    const reminder = await this.prisma.taskReminder.create({
      data: {
        taskId,
        userId,
        ...createTaskReminderDto,
      },
    });

    const jobId = `task-reminder-${reminder.id}`;

    await this.notificationsQueueService.addSendTaskReminderJob(
      { reminderId: reminder.id },
      remindAt,
      jobId,
    );

    return this.prisma.taskReminder.update({
      where: {
        id: reminder.id,
      },
      data: {
        jobId,
      },
    });
  }

  async findAll(userId: string, taskId: string) {
    await this.ensureTaskMember(taskId, userId);

    return this.prisma.taskReminder.findMany({
      where: {
        taskId,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async remove(userId: string, taskId: string, id: string) {
    await this.ensureTaskMember(taskId, userId);

    const reminder = await this.prisma.taskReminder.findFirst({
      where: {
        id,
        taskId,
        userId,
      },
    });

    if (!reminder) {
      throw new NotFoundException('Task reminder not found');
    }

    if (reminder.jobId && !reminder.sentAt) {
      await this.notificationsQueueService.removeJob(reminder.jobId);
    }

    await this.prisma.taskReminder.delete({
      where: {
        id,
        taskId,
        userId,
      },
    });
  }

  async update(
    userId: string,
    taskId: string,
    id: string,
    updateTaskReminderDto: UpdateTaskReminderDto,
  ) {
    const remindAt = new Date(updateTaskReminderDto.remindAt);

    if (remindAt.getTime() <= Date.now()) {
      throw new BadRequestException('Reminder date must be in the future');
    }

    const reminder = await this.prisma.taskReminder.findFirst({
      where: {
        id,
        taskId,
        userId,
      },
    });

    if (!reminder) {
      throw new NotFoundException('Task reminder not found');
    }

    if (reminder.sentAt) {
      throw new BadRequestException('Sent reminder cannot be updated');
    }

    if (reminder.jobId) {
      await this.notificationsQueueService.removeJob(reminder.jobId);
    }

    const jobId = `task-reminder-${reminder.id}`;

    await this.notificationsQueueService.addSendTaskReminderJob(
      { reminderId: reminder.id },
      remindAt,
      jobId,
    );

    return this.prisma.taskReminder.update({
      where: {
        id: reminder.id,
      },
      data: {
        remindAt,
        jobId,
      },
    });
  }
}
