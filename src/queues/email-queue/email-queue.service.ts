import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { EMAIL_JOBS, EMAIL_QUEUE } from './email-queue.constants';
import { SendPasswordResetEmailJobPayload } from './types/send-password-reset-email-job-payload.type';
import { defaultJobOptions } from '../config/default-job-options';

@Injectable()
export class EmailQueueService {
  constructor(
    @InjectQueue(EMAIL_QUEUE)
    private readonly emailQueue: Queue<SendPasswordResetEmailJobPayload>,
  ) {}

  async addSendPasswordResetEmailJob(
    payload: SendPasswordResetEmailJobPayload,
  ) {
    await this.emailQueue.add(EMAIL_JOBS.SEND_PASSWORD_RESET_EMAIL, payload, {
      ...defaultJobOptions,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }
}
