import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  IsUUID,
} from 'class-validator';

import {
  TaskPriority,
  TaskStatus,
  TaskType,
} from '../../../generated/prisma/enums';

export class UpdateTaskDto {
  @ApiPropertyOptional({
    example: 'Updated Implement JWT authentication',
    minLength: 2,
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated Implement JWT authentication for secure API access',
    minLength: 2,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    example: TaskStatus.IN_PROGRESS,
    enum: TaskStatus,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    example: TaskPriority.HIGH,
    enum: TaskPriority,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    example: TaskType.BUG,
    enum: TaskType,
  })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;
}
