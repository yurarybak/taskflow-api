import { ApiProperty } from '@nestjs/swagger';

import { PaginationMetaResponseDto } from '../../../common/dto/responses/pagination-meta-response.dto';
import { WorkspaceResponseDto } from './workspace-response.dto';

export class PaginatedWorkspacesResponseDto {
  @ApiProperty({
    type: [WorkspaceResponseDto],
  })
  data!: WorkspaceResponseDto[];

  @ApiProperty({
    type: PaginationMetaResponseDto,
  })
  meta!: PaginationMetaResponseDto;
}
