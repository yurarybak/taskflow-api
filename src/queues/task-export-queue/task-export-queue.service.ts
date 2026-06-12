import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { defaultJobOptions } from '../config/default-job-options';
import { ExportProjectTasksCsvJobPayload } from './types/export-project-tasks-csv-job-payload.type';
import {
  TASK_EXPORT_QUEUE,
  TASK_EXPORT_JOBS,
} from './task-export-queue.constants';

@Injectable()
export class TaskExportQueueService {
  constructor(
    @InjectQueue(TASK_EXPORT_QUEUE)
    private readonly taskExportQueue: Queue<ExportProjectTasksCsvJobPayload>,
  ) {}

  async addExportProjectTasksCsvJob(payload: ExportProjectTasksCsvJobPayload) {
    await this.taskExportQueue.add(
      TASK_EXPORT_JOBS.EXPORT_PROJECT_TASKS_CSV,
      payload,
      defaultJobOptions,
    );
  }
}
