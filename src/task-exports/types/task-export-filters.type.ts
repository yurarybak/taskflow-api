import {
  TaskStatus,
  TaskPriority,
  TaskType,
} from '../../../generated/prisma/enums';

export type TaskExportFilters = {
  statuses?: TaskStatus[];
  priorities?: TaskPriority[];
  types?: TaskType[];
  assigneeIds?: string[];
  labelIds?: string[];
  milestoneIds?: string[];
  withoutAssignee?: boolean;
  withoutMilestone?: boolean;
  includeArchived?: boolean;
  search?: string;
};
