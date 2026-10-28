import type { Label, TaskTemplate } from '../../../generated/prisma/client';

export interface TaskTemplateWithLabels extends TaskTemplate {
  labels: Label[];
}
