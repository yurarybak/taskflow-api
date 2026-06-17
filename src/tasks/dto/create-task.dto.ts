import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';

import {
  TaskPriority,
  TaskStatus,
  TaskType,
} from '../../../generated/prisma/enums';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Implement JWT authentication',
    minLength: 2,
    maxLength: 120,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({
    example: 'Implement JWT authentication for secure API access',
    minLength: 2,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    example: TaskStatus.TODO,
    enum: TaskStatus,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    example: TaskPriority.MEDIUM,
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
  dueDate?: string;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({
    example: 480,
    description: 'Original estimate in minutes',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  originalEstimateMinutes?: number;

  @ApiPropertyOptional({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  milestoneId?: string;
}
