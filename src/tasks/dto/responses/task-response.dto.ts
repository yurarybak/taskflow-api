import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  TaskPriority,
  TaskStatus,
  TaskType,
} from '../../../../generated/prisma/enums';

import { LabelResponseDto } from '../../../labels/dto/responses/label-response.dto';

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

  @ApiProperty({
    enum: TaskType,
    example: TaskType.BUG,
  })
  type!: TaskType;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  dueDate?: string | null;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  startDate?: string | null;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  projectId!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  creatorId!: string;

  @ApiPropertyOptional({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
    nullable: true,
  })
  assigneeId?: string;

  @ApiProperty({
    type: [LabelResponseDto],
  })
  labels!: LabelResponseDto[];

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
