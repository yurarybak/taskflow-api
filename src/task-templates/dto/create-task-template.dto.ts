import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { TaskType, TaskPriority } from '../../../generated/prisma/enums';

export class CreateTaskTemplateDto {
  @ApiProperty({
    example: 'Bug report',
    minLength: 2,
    maxLength: 120,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    example: 'Bug: short issue summary',
    minLength: 2,
    maxLength: 120,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({
    example:
      'Steps to reproduce:\\n1. ...\\n\\nExpected result:\\n...\\n\\nActual result:\\n...',
    minLength: 2,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    example: TaskType.BUG,
    enum: TaskType,
  })
  @IsEnum(TaskType)
  type?: TaskType;

  @ApiPropertyOptional({
    example: TaskPriority.MEDIUM,
    enum: TaskPriority,
  })
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: ['label-id-1', 'label-id-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];
}
