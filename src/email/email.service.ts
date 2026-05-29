import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  sendPasswordResetEmail(email: string, resetToken: string) {
    // TODO: Implement the actual email sending logic here
    // nodemailer, SendGrid, AWS SES.
    console.log(`
      Sending password reset email to ${email} with token: ${resetToken}
    `);
  }
}
