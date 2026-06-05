import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MilestoneResponseDto {
  @ApiProperty({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
  })
  id!: string;

  @ApiProperty({
    example: 'MVP',
  })
  name!: string;

  @ApiPropertyOptional({
    example: 'Initial release scope',
    nullable: true,
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: '2026-06-10T09:00:00.000Z',
    nullable: true,
  })
  startDate?: string | null;

  @ApiPropertyOptional({
    example: '2026-06-30T18:00:00.000Z',
    nullable: true,
  })
  dueDate?: string | null;

  @ApiPropertyOptional({
    example: '2026-06-30T18:00:00.000Z',
    nullable: true,
  })
  completedAt?: string | null;

  @ApiProperty({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
  })
  projectId!: string;

  @ApiProperty({
    example: '2026-06-04T10:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-06-04T10:00:00.000Z',
  })
  updatedAt!: string;
}