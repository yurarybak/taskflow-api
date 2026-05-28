import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkspaceResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    example: 'Project Alpha',
  })
  name!: string;

  @ApiPropertyOptional({
    example: 'This is a workspace for Project Alpha',
  })
  description?: string | null;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  ownerId!: string;

  @ApiProperty({
    example: new Date().toISOString(),
  })
  createdAt!: Date;

  @ApiProperty({
    example: new Date().toISOString(),
  })
  updatedAt!: Date;
}
