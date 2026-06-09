import { NotificationType } from '../../../generated/prisma/enums';
import { Prisma } from '../../../generated/prisma/client';

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  data?: Prisma.InputJsonValue;
};
