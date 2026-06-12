import { Test, TestingModule } from '@nestjs/testing';
import { TaskExportsController } from './task-exports.controller';

describe('TaskExportsController', () => {
  let controller: TaskExportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskExportsController],
    }).compile();

    controller = module.get<TaskExportsController>(TaskExportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
