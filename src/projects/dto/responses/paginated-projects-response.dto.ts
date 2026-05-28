import { ApiProperty } from '@nestjs/swagger';

import { ProjectResponseDto } from './project-response.dto';
import { PaginationMetaResponseDto } from '../../../common/dto/responses/pagination-meta-response.dto';

export class PaginatedProjectsResponseDto {
  @ApiProperty({
    type: [ProjectResponseDto],
  })
  data!: ProjectResponseDto[];

  @ApiProperty({
    type: PaginationMetaResponseDto,
  })
  meta!: PaginationMetaResponseDto;
}
