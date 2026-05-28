import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    example: 'Project Alpha',
  })
  name!: string;

  @ApiPropertyOptional({
    example: 'This is a sample project description',
  })
  description?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  workspaceId!: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2024-01-02T00:00:00.000Z',
  })
  updatedAt!: Date;
}
