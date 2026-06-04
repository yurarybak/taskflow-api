import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class UserResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiPropertyOptional({
    example: 'John',
  })
  firstName?: string | null;

  @ApiPropertyOptional({
    example: 'Doe',
  })
  lastName?: string | null;
}

export class TaskWatcherResponseDto {
  @ApiProperty({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
  })
  id!: string;

  @ApiProperty({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
  })
  taskId!: string;

  @ApiProperty({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
  })
  userId!: string;

  @ApiProperty({
    type: UserResponseDto,
  })
  user!: UserResponseDto;

  @ApiProperty({
    example: '2026-06-04T10:00:00.000Z',
  })
  createdAt!: string;
}
