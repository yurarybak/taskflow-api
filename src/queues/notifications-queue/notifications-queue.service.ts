import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import {
  NOTIFICATION_JOBS,
  NOTIFICATIONS_QUEUE,
} from './notifications-queue.constants';
import { defaultJobOptions } from '../config/default-job-options';
import { CreateNotificationJobPayload } from './types/create-notification-job-payload.type';
import { SendTaskReminderJobPayload } from './types/send-task-reminder-job-payload.type';

type NotificationsQueuePayload =
  | CreateNotificationJobPayload
  | SendTaskReminderJobPayload;

@Injectable()
export class NotificationsQueueService {
  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly notificationsQueue: Queue<NotificationsQueuePayload>,
  ) {}

  async addCreateNotificationJob(payload: CreateNotificationJobPayload) {
    await this.notificationsQueue.add(
      NOTIFICATION_JOBS.CREATE_NOTIFICATION,
      payload,
      defaultJobOptions,
    );
  }

  async addSendTaskReminderJob(
    payload: CreateNotificationJobPayload,
    remindAt: Date,
    jobId: string,
  ) {
    const delay = remindAt.getTime() - Date.now();

    await this.notificationsQueue.add(
      NOTIFICATION_JOBS.SEND_TASK_REMINDER,
      payload,
      {
        ...defaultJobOptions,
        jobId,
        delay: Math.max(delay, 0),
      },
    );
  }
}
