import { Test, TestingModule } from '@nestjs/testing';
import { SavedTaskFiltersController } from './saved-task-filters.controller';

describe('SavedTaskFiltersController', () => {
  let controller: SavedTaskFiltersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavedTaskFiltersController],
    }).compile();

    controller = module.get<SavedTaskFiltersController>(SavedTaskFiltersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
