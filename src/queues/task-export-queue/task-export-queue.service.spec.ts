import { Test, TestingModule } from '@nestjs/testing';
import { TaskExportQueueService } from './task-export-queue.service';

describe('TaskExportQueueService', () => {
  let service: TaskExportQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskExportQueueService],
    }).compile();

    service = module.get<TaskExportQueueService>(TaskExportQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
