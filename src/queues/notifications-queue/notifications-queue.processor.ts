import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

import { NotificationsService } from '../../notifications/notifications.service';
import { TaskRemindersService } from '../../task-reminders/task-reminders.service';
import {
  NOTIFICATION_JOBS,
  NOTIFICATIONS_QUEUE,
} from './notifications-queue.constants';
import { CreateNotificationJobPayload } from './types/create-notification-job-payload.type';
import { SendTaskReminderJobPayload } from './types/send-task-reminder-job-payload.type';
import type { Notification } from '../../../generated/prisma/client';

@Processor(NOTIFICATIONS_QUEUE)
@Injectable()
export class NotificationsQueueProcessor extends WorkerHost {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly taskRemindersService: TaskRemindersService,
  ) {
    super();
  }

  private readonly logger = new Logger(NotificationsQueueProcessor.name);

  async process(
    job: Job<CreateNotificationJobPayload | SendTaskReminderJobPayload>,
  ): Promise<void | Notification> {
    switch (job.name) {
      case NOTIFICATION_JOBS.CREATE_NOTIFICATION:
        return this.notificationsService.create(
          job.data as CreateNotificationJobPayload,
        );

      case NOTIFICATION_JOBS.SEND_TASK_REMINDER:
        return this.taskRemindersService.sendReminder(
          (job.data as SendTaskReminderJobPayload).reminderId,
        );

      default:
        throw new Error(`Unknown notification job: ${job.name}`);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Job ${job.id} started: ${job.name}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job ${job.id} completed: ${job.name}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Job ${job.id} failed: ${job.name}`, error.stack);
  }
}
