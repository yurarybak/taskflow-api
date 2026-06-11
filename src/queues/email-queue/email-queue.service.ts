import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { EMAIL_JOBS, EMAIL_QUEUE } from './email-queue.constants';
import { SendPasswordResetEmailJobPayload } from './types/send-password-reset-email-job-payload.type';

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
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        count: 100,
      },
      removeOnFail: {
        count: 1000,
      },
    });
  }
}
