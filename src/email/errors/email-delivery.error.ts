import type { SendGridErrorItem } from '../types/email-delivery.type';

/** Raised when the email provider rejects or fails a send; BullMQ retries the job on it. */
export class EmailDeliveryError extends Error {
  constructor(
    message: string,
    readonly statusCode: number | null,
    readonly providerErrors: SendGridErrorItem[],
  ) {
    super(message);
    this.name = EmailDeliveryError.name;
  }
}
