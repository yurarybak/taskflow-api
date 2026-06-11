import { JobsOptions } from 'bullmq';

export const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: {
    count: 100,
  },
  removeOnFail: {
    count: 1000,
  },
};
