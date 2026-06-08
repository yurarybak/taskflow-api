import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsArray,
  IsBoolean,
} from 'class-validator';
import {
  TaskStatus,
  TaskPriority,
  TaskType,
} from '../../../generated/prisma/enums';
import { Transform } from 'class-transformer';

export class FindTasksQueryDto {
  @ApiPropertyOptional({
    description: 'Filter tasks by status, comma-separated list of statuses',
    enum: TaskStatus,
    isArray: true,
    example: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').filter(Boolean) : [],
  )
  @IsArray()
  @IsEnum(TaskStatus, { each: true })
  statuses?: TaskStatus[];

  @ApiPropertyOptional({
    description: 'Filter tasks by priority, comma-separated list of priorities',
    enum: TaskPriority,
    isArray: true,
    example: [TaskPriority.LOW, TaskPriority.MEDIUM],
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').filter(Boolean) : [],
  )
  @IsArray()
  @IsEnum(TaskPriority, { each: true })
  priorities?: TaskPriority[];

  @ApiPropertyOptional({
    description: 'Filter tasks by type, comma-separated list of types',
    enum: TaskType,
    isArray: true,
    example: [TaskType.BUG, TaskType.FEATURE],
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').filter(Boolean) : [],
  )
  @IsArray()
  @IsEnum(TaskType, { each: true })
  types?: TaskType[];

  @ApiPropertyOptional({
    example:
      '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10,2b7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c20',
    description: 'Comma-separated milestone ids',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').filter(Boolean) : [],
  )
  @IsArray()
  @IsUUID('all', { each: true })
  milestoneIds?: string[];

  @ApiPropertyOptional({
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  withoutMilestone?: boolean;

  @ApiPropertyOptional({
    description: 'Search term for task title or description',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination (default: 1)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page for pagination (default: 10)',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter tasks by assignee IDs, comma-separated list of UUIDs',
    example:
      '550e8400-e29b-41d4-a716-446655440000,550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').filter(Boolean) : [],
  )
  @IsArray()
  @IsUUID('all', { each: true })
  assigneeIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter for unassigned tasks',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  unassigned?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Filter archived or active tasks',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  archived?: boolean;
}
