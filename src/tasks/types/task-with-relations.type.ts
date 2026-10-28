import type { Label, Task } from '../../../generated/prisma/client';
import type { UserSummary } from '../../common/types/user-summary.type';

export interface TaskWithLabels extends Task {
  labels: Label[];
}

export interface TaskWithLabelsAndPeople extends TaskWithLabels {
  creator: UserSummary;
  assignee: UserSummary | null;
}
