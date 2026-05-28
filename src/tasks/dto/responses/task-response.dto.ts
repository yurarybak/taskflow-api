import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { TaskPriority, TaskStatus } from '../../../../generated/prisma/enums';

export class TaskResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    example: 'Implement JWT authentication',
  })
  title!: string;

  @ApiPropertyOptional({
    example: 'Implement JWT authentication for secure API access',
  })
  description?: string;

  @ApiProperty({
    example: TaskStatus.IN_PROGRESS,
    enum: TaskStatus,
  })
  status!: TaskStatus;

  @ApiProperty({
    example: TaskPriority.HIGH,
    enum: TaskPriority,
  })
  priority!: TaskPriority;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  dueDate?: Date;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  projectId!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  creatorId!: string;

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
