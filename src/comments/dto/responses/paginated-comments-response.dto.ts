import { ApiProperty } from '@nestjs/swagger';

import { CommentResponseDto } from './comment-response.dto';
import { PaginationMetaResponseDto } from '../../../common/dto/responses/pagination-meta-response.dto';

export class PaginatedCommentsResponseDto {
  @ApiProperty({
    type: [CommentResponseDto],
  })
  data!: CommentResponseDto[];

  @ApiProperty({
    type: PaginationMetaResponseDto,
  })
  meta!: PaginationMetaResponseDto;
}
