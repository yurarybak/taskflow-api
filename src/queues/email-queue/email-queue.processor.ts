import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

import { EmailService } from '../../email/email.service';
import { EMAIL_JOBS, EMAIL_QUEUE } from './email-queue.constants';
import { SendPasswordResetEmailJobPayload } from './types/send-password-reset-email-job-payload.type';

@Processor(EMAIL_QUEUE)
@Injectable()
export class EmailQueueProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<SendPasswordResetEmailJobPayload>) {
    switch (job.name) {
      case EMAIL_JOBS.SEND_PASSWORD_RESET_EMAIL:
        return this.emailService.sendPasswordResetEmail(
          job.data.to,
          job.data.fullName,
          job.data.resetLink,
        );

      default:
        throw new Error(`Unknown notification job: ${job.name}`);
    }
  }
}
