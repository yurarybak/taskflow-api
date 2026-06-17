import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

import { TaskExportsService } from '../../task-exports/task-exports.service';
import { ExportProjectTasksCsvJobPayload } from './types/export-project-tasks-csv-job-payload.type';

import {
  TASK_EXPORT_QUEUE,
  TASK_EXPORT_JOBS,
} from './task-export-queue.constants';

@Processor(TASK_EXPORT_QUEUE, {
  concurrency: 2,
})
@Injectable()
export class TaskExportQueueProcessor extends WorkerHost {
  constructor(private readonly taskExportsService: TaskExportsService) {
    super();
  }

  private readonly logger = new Logger(TaskExportQueueProcessor.name);

  async process(job: Job<ExportProjectTasksCsvJobPayload>) {
    switch (job.name) {
      case TASK_EXPORT_JOBS.EXPORT_PROJECT_TASKS_CSV:
        return this.taskExportsService.generateProjectTasksCsv(
          job.data.exportId,
          job,
        );
      default:
        throw new Error(`Unknown notification job: ${job.name}`);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} started: ${job.name}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed: ${job.name}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${job.name}`, error.stack);
  }
}
