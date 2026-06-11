import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import {
  NOTIFICATION_JOBS,
  NOTIFICATIONS_QUEUE,
} from './notifications-queue.constants';
import { CreateNotificationJobPayload } from './types/create-notification-job-payload.type';

@Injectable()
export class NotificationsQueueService {
  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly notificationsQueue: Queue<CreateNotificationJobPayload>,
  ) {}

  async addCreateNotificationJob(payload: CreateNotificationJobPayload) {
    await this.notificationsQueue.add(
      NOTIFICATION_JOBS.CREATE_NOTIFICATION,
      payload,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          count: 100,
        },
        removeOnFail: {
          count: 1000,
        },
      },
    );
  }
}
