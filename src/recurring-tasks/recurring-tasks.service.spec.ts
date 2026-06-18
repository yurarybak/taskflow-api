import { Test, TestingModule } from '@nestjs/testing';
import { RecurringTasksService } from './recurring-tasks.service';

describe('RecurringTasksService', () => {
  let service: RecurringTasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecurringTasksService],
    }).compile();

    service = module.get<RecurringTasksService>(RecurringTasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
