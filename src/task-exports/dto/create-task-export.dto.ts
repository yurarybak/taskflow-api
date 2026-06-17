import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, IsBoolean, IsString } from 'class-validator';
import {
  TaskStatus,
  TaskPriority,
  TaskType,
} from '../../../generated/prisma/enums';
export class CreateTaskExportDto {
  @ApiPropertyOptional({
    enum: TaskStatus,
    isArray: true,
    example: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
  })
  @IsOptional()
  @IsArray()
  statuses?: TaskStatus[];

  @ApiPropertyOptional({
    enum: TaskPriority,
    isArray: true,
    example: [TaskPriority.HIGH],
  })
  @IsOptional()
  @IsArray()
  priorities?: TaskPriority[];

  @ApiPropertyOptional({
    enum: TaskType,
    isArray: true,
    example: [TaskType.BUG, TaskType.FEATURE],
  })
  @IsOptional()
  @IsArray()
  types?: TaskType[];

  @ApiPropertyOptional({
    example: ['user-id-1', 'user-id-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];

  @ApiPropertyOptional({
    example: ['label-id-1', 'label-id-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];

  @ApiPropertyOptional({
    example: ['milestone-id-1'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  milestoneIds?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  withoutAssignee?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  withoutMilestone?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  includeArchived?: boolean;

  @ApiPropertyOptional({ example: 'auth' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: ['task-id-1', 'task-id-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taskIds?: string[];
}
