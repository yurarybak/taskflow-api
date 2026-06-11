import { Injectable } from '@nestjs/common';

import { NotificationType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaskRemindersService {
  constructor(private readonly prisma: PrismaService) {}

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
}
