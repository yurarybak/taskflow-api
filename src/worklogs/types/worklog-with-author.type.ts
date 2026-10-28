import type { Worklog } from '../../../generated/prisma/client';
import type { UserSummary } from '../../common/types/user-summary.type';

export interface WorklogWithAuthor extends Worklog {
  author: UserSummary;
}
