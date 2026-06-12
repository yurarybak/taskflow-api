import { ApiProperty } from '@nestjs/swagger';

import { TaskExportResponseDto } from './task-export-response-dto';
import { PaginationMetaResponseDto } from '../../../common/dto/responses/pagination-meta-response.dto';

export class PaginatedTaskExportsResponseDto {
  @ApiProperty({
    type: [TaskExportResponseDto],
  })
  data!: TaskExportResponseDto[];

  @ApiProperty({
    type: PaginationMetaResponseDto,
  })
  meta!: PaginationMetaResponseDto;
}
