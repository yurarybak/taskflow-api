import type { TaskWatcher } from '../../../generated/prisma/client';
import type { UserSummary } from '../../common/types/user-summary.type';

export interface TaskWatcherWithUser extends TaskWatcher {
  user: UserSummary;
}
