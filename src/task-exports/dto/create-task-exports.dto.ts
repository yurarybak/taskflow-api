import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
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

export class CreateTaskExportsDto {
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
