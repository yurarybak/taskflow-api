export type PasswordResetPayload = {
  sub: string;
  email: string;
  purpose: 'password_reset';
};
