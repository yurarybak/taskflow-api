import { Test, TestingModule } from '@nestjs/testing';
import { WorklogsService } from './worklogs.service';

describe('WorklogsService', () => {
  let service: WorklogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorklogsService],
    }).compile();

    service = module.get<WorklogsService>(WorklogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
