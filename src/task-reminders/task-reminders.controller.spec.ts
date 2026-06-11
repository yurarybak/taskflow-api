import { Test, TestingModule } from '@nestjs/testing';
import { TaskRemindersController } from './task-reminders.controller';

describe('TaskRemindersController', () => {
  let controller: TaskRemindersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskRemindersController],
    }).compile();

    controller = module.get<TaskRemindersController>(TaskRemindersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
