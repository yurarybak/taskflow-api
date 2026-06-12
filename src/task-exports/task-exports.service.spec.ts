import { Test, TestingModule } from '@nestjs/testing';
import { TaskExportsService } from './task-exports.service';

describe('TaskExportsService', () => {
  let service: TaskExportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskExportsService],
    }).compile();

    service = module.get<TaskExportsService>(TaskExportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
