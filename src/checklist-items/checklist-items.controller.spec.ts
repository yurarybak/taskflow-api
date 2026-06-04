import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistItemsController } from './checklist-items.controller';

describe('ChecklistItemsController', () => {
  let controller: ChecklistItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChecklistItemsController],
    }).compile();

    controller = module.get<ChecklistItemsController>(ChecklistItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
