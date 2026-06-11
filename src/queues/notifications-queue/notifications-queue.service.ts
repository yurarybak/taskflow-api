import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import {
  NOTIFICATION_JOBS,
  NOTIFICATIONS_QUEUE,
} from './notifications-queue.constants';
import { CreateNotificationJobPayload } from './types/create-notification-job-payload.type';
import { defaultJobOptions } from '../config/default-job-options';

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
      defaultJobOptions,
    );
  }
}
