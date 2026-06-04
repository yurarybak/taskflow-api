import { Test, TestingModule } from '@nestjs/testing';
import { TaskWatchersService } from './task-watchers.service';

describe('TaskWatchersService', () => {
  let service: TaskWatchersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskWatchersService],
    }).compile();

    service = module.get<TaskWatchersService>(TaskWatchersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
