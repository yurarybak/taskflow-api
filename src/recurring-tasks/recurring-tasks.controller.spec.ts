import { Test, TestingModule } from '@nestjs/testing';
import { RecurringTasksController } from './recurring-tasks.controller';

describe('RecurringTasksController', () => {
  let controller: RecurringTasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringTasksController],
    }).compile();

    controller = module.get<RecurringTasksController>(RecurringTasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
