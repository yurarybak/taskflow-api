import type { TaskComment } from '../../../generated/prisma/client';
import type { PublicUser } from '../../common/types/user-summary.type';

export interface TaskCommentWithAuthor extends TaskComment {
  author: PublicUser;
}
