import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { TaskPriority, TaskStatus } from '../../../generated/prisma/enums';

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
    example: '2024-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;
}
