import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AuthUserResponseDto } from '../../../auth/dto/responses/auth-user-response.dto';

export class WorklogResponseDto {
  @ApiProperty({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
  })
  id!: string;

  @ApiProperty({
    example: 120,
    description: 'Time spent in minutes',
  })
  timeSpentMinutes!: number;

  @ApiPropertyOptional({
    example: 'Implemented DTO and service methods',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    example: '2026-06-08T10:00:00.000Z',
  })
  startedAt!: string;

  @ApiProperty({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
  })
  taskId!: string;

  @ApiProperty({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
  })
  authorId!: string;

  @ApiProperty({
    type: AuthUserResponseDto,
  })
  author!: AuthUserResponseDto;

  @ApiProperty({
    example: '2026-06-08T10:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-06-08T10:00:00.000Z',
  })
  updatedAt!: string;
}
