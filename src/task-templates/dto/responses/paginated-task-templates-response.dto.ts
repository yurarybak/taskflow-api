import { ApiProperty } from '@nestjs/swagger';

import { TaskTemplateResponseDto } from './task-template-response.dto';
import { PaginationMetaResponseDto } from '../../../common/dto/responses/pagination-meta-response.dto';

export class PaginatedTasksResponseDto {
  @ApiProperty({
    type: [TaskTemplateResponseDto],
  })
  data!: TaskTemplateResponseDto[];

  @ApiProperty({
    type: PaginationMetaResponseDto,
  })
  meta!: PaginationMetaResponseDto;
}
