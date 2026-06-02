import { Test, TestingModule } from '@nestjs/testing';
import { TaskActivityService } from './task-activity.service';

describe('TaskActivityService', () => {
  let service: TaskActivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskActivityService],
    }).compile();

    service = module.get<TaskActivityService>(TaskActivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
