import { ApiProperty } from '@nestjs/swagger';

import { TaskActivityResponseDto } from './task-activity-response.dto';
import { PaginationMetaResponseDto } from '../../../common/dto/responses/pagination-meta-response.dto';

export class PaginatedTaskActivitiesResponseDto {
  @ApiProperty({
    type: [TaskActivityResponseDto],
  })
  data!: TaskActivityResponseDto[];

  @ApiProperty({
    type: PaginationMetaResponseDto,
  })
  meta!: PaginationMetaResponseDto;
}
