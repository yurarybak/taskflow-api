import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {
    sgMail.setApiKey(this.configService.getOrThrow<string>('SENDGRID_API_KEY'));
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    resetLink: string,
  ): Promise<void> {
    await sgMail.send({
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
  }
}
