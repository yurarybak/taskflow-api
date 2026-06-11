import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

import { NotificationsService } from '../../notifications/notifications.service';
import {
  NOTIFICATION_JOBS,
  NOTIFICATIONS_QUEUE,
} from './notifications-queue.constants';
import { CreateNotificationJobPayload } from './types/create-notification-job-payload.type';

@Processor(NOTIFICATIONS_QUEUE)
@Injectable()
export class NotificationsQueueProcessor extends WorkerHost {
  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<CreateNotificationJobPayload>) {
    switch (job.name) {
      case NOTIFICATION_JOBS.CREATE_NOTIFICATION:
        return this.notificationsService.create(job.data);

      default:
        throw new Error(`Unknown notification job: ${job.name}`);
    }
  }
}
