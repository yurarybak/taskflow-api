import { ApiProperty } from '@nestjs/swagger';

import { WorklogResponseDto } from './worklog-response.dto';
import { PaginationMetaResponseDto } from '../../../common/dto/responses/pagination-meta-response.dto';

export class PaginatedTasksResponseDto {
  @ApiProperty({
    type: [WorklogResponseDto],
  })
  data!: WorklogResponseDto[];

  @ApiProperty({
    type: PaginationMetaResponseDto,
  })
  meta!: PaginationMetaResponseDto;
}
