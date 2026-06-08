import { ApiProperty } from '@nestjs/swagger';

export class SavedTaskFilterResponseDto {
  @ApiProperty({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
  })
  id!: string;

  @ApiProperty({
    example: 'My high priority bugs',
  })
  name!: string;

  @ApiProperty({
    example: {
      statuses: ['TODO', 'IN_PROGRESS'],
      priorities: ['HIGH'],
      types: ['BUG'],
      milestones: ['Auth', 'JWT'],
    },
  })
  filters!: Record<string, unknown>;

  @ApiProperty({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
  })
  projectId!: string;

  @ApiProperty({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
  })
  userId!: string;

  @ApiProperty({
    example: '2026-06-08T10:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-06-08T10:00:00.000Z',
  })
  updatedAt!: string;
}
