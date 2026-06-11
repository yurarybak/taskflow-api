import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

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

  private readonly logger = new Logger(NotificationsQueueProcessor.name);

  async process(job: Job<CreateNotificationJobPayload>) {
    switch (job.name) {
      case NOTIFICATION_JOBS.CREATE_NOTIFICATION:
        return this.notificationsService.create(job.data);

      default:
        throw new Error(`Unknown notification job: ${job.name}`);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} started: ${job.name}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed: ${job.name}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${job.name}`, error.stack);
  }
}
