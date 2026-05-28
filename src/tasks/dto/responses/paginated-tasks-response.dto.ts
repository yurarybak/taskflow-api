import { ApiProperty } from '@nestjs/swagger';

import { TaskResponseDto } from './task-response.dto';
import { PaginationMetaResponseDto } from '../../../common/dto/responses/pagination-meta-response.dto';

export class PaginatedTasksResponseDto {
  @ApiProperty({
    type: [TaskResponseDto],
  })
  data!: TaskResponseDto[];

  @ApiProperty({
    type: PaginationMetaResponseDto,
  })
  meta!: PaginationMetaResponseDto;
}
