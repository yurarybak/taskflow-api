import { ApiProperty } from '@nestjs/swagger';

import { AuthUserResponseDto } from '../../../auth/dto/responses/auth-user-response.dto';

export class CommentResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the comment',
    example: 'cmt_1234567890abcdef',
  })
  id!: string;

  @ApiProperty({
    description: 'The content of the comment',
    example: 'This is a comment',
  })
  content!: string;

  @ApiProperty({
    description: 'The unique identifier of the author of the comment',
    example: 'usr_1234567890abcdef',
  })
  authorId!: string;

  @ApiProperty({
    description: 'The author of the comment',
    type: AuthUserResponseDto,
  })
  author!: AuthUserResponseDto;

  @ApiProperty({
    description: 'The unique identifier of the task the comment belongs to',
    example: 'tsk_1234567890abcdef',
  })
  taskId!: string;

  @ApiProperty({
    description: 'The date and time when the comment was created',
    example: '2024-06-01T12:34:56.789Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'The date and time when the comment was last updated',
    example: '2024-06-01T12:34:56.789Z',
  })
  updatedAt!: Date;
}
