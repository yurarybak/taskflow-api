import { Test, TestingModule } from '@nestjs/testing';
import { TaskActivityController } from './task-activity.controller';

describe('TaskActivityController', () => {
  let controller: TaskActivityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskActivityController],
    }).compile();

    controller = module.get<TaskActivityController>(TaskActivityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
