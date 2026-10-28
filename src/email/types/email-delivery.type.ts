export interface EmailDeliveryResult {
  statusCode: number;
  /** SendGrid message id from the `x-message-id` response header. */
  messageId: string | null;
}

/** Single entry of the SendGrid v3 error response body. */
export interface SendGridErrorItem {
  message: string;
  field?: string | null;
  help?: string | null;
}
