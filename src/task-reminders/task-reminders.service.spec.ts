import { Test, TestingModule } from '@nestjs/testing';
import { TaskRemindersService } from './task-reminders.service';

describe('TaskRemindersService', () => {
  let service: TaskRemindersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskRemindersService],
    }).compile();

    service = module.get<TaskRemindersService>(TaskRemindersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
