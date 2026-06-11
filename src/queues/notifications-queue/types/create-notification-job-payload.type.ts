import { NotificationType } from '../../../../generated/prisma/enums';
import { Prisma } from '../../../../generated/prisma/client';

export type CreateNotificationJobPayload = {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  data?: Prisma.InputJsonValue;
};
