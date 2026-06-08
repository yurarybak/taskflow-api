import { Test, TestingModule } from '@nestjs/testing';
import { SavedTaskFiltersService } from './saved-task-filters.service';

describe('SavedTaskFiltersService', () => {
  let service: SavedTaskFiltersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SavedTaskFiltersService],
    }).compile();

    service = module.get<SavedTaskFiltersService>(SavedTaskFiltersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
