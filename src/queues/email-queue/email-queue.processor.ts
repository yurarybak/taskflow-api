import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

import { EmailService } from '../../email/email.service';
import { EMAIL_JOBS, EMAIL_QUEUE } from './email-queue.constants';
import { SendPasswordResetEmailJobPayload } from './types/send-password-reset-email-job-payload.type';

import type { EmailDeliveryResult } from '../../email/types/email-delivery.type';

@Processor(EMAIL_QUEUE)
@Injectable()
export class EmailQueueProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  private readonly logger = new Logger(EmailQueueProcessor.name);

  async process(
    job: Job<SendPasswordResetEmailJobPayload>,
  ): Promise<EmailDeliveryResult> {
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
