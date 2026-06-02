import { ApiProperty } from '@nestjs/swagger';

export class LabelResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    example: 'backend',
  })
  name!: string;

  @ApiProperty({
    example: '#2563EB',
  })
  color!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  workspaceId!: string;

  @ApiProperty({
    example: '2024-01-01T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2024-01-02T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt!: Date;
}
