import { Test, TestingModule } from '@nestjs/testing';
import { TaskWatchersController } from './task-watchers.controller';

describe('TaskWatchersController', () => {
  let controller: TaskWatchersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskWatchersController],
    }).compile();

    controller = module.get<TaskWatchersController>(TaskWatchersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
