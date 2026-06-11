export type SendPasswordResetEmailJobPayload = {
  to: string;
  fullName: string;
  resetLink: string;
};
