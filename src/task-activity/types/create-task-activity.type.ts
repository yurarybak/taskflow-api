import { TaskActivityType } from '../../../generated/prisma/enums';
import { Prisma } from '../../../generated/prisma/client';

export type CreateTaskActivityInput = {
  taskId: string;
  actorId: string;
  type: TaskActivityType;
  metadata?: Prisma.InputJsonValue;
};
