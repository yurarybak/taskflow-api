import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import { EmailDeliveryError } from './errors/email-delivery.error';

import type { ResponseError } from '@sendgrid/mail';
import type {
  EmailDeliveryResult,
  SendGridErrorItem,
} from './types/email-delivery.type';

// @sendgrid/mail declares ResponseError but does not export it at runtime, so instanceof is not possible.
function isSendGridResponseError(error: unknown): error is ResponseError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'number' &&
    'response' in error &&
    typeof error.response === 'object'
  );
}

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {
    sgMail.setApiKey(this.configService.getOrThrow<string>('SENDGRID_API_KEY'));
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    resetLink: string,
  ): Promise<EmailDeliveryResult> {
    try {
      const [response] = await sgMail.send({
        to: email,
        from: {
          email: this.configService.getOrThrow<string>('SENDGRID_FROM_EMAIL'),
          name: this.configService.getOrThrow<string>('SENDGRID_FROM_NAME'),
        },
        templateId: this.configService.getOrThrow<string>(
          'SENDGRID_PASSWORD_RESET_TEMPLATE_ID',
        ),
        dynamicTemplateData: {
          resetLink,
          fullName,
        },
      });
      const headers = response.headers as Record<string, string | undefined>;

      return {
        statusCode: response.statusCode,
        messageId: headers['x-message-id'] ?? null,
      };
    } catch (error: unknown) {
      throw this.toDeliveryError(error);
    }
  }

  private toDeliveryError(error: unknown): EmailDeliveryError {
    if (isSendGridResponseError(error)) {
      return new EmailDeliveryError(
        `SendGrid rejected the email: ${error.message}`,
        error.code,
        this.parseProviderErrors(error.response?.body),
      );
    }

    const message = error instanceof Error ? error.message : String(error);

    return new EmailDeliveryError(
      `Email delivery failed: ${message}`,
      null,
      [],
    );
  }

  // The SDK types the body as string, but it is the parsed JSON payload at runtime.
  private parseProviderErrors(body: unknown): SendGridErrorItem[] {
    const payload: unknown =
      typeof body === 'string' ? this.tryParseJson(body) : body;

    if (
      typeof payload === 'object' &&
      payload !== null &&
      'errors' in payload &&
      Array.isArray(payload.errors)
    ) {
      return (payload.errors as unknown[]).filter(
        (item): item is SendGridErrorItem =>
          typeof item === 'object' &&
          item !== null &&
          'message' in item &&
          typeof item.message === 'string',
      );
    }

    return [];
  }

  private tryParseJson(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}
