import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { TaskPriority, TaskType } from '../../../../generated/prisma/enums';

class TaskTemplateLabelResponseDto {
  @ApiProperty({ example: 'label-id' })
  id!: string;

  @ApiProperty({ example: 'Bug' })
  name!: string;

  @ApiProperty({ example: '#ef4444' })
  color!: string;
}

export class TaskTemplateResponseDto {
  @ApiProperty({ example: 'template-id' })
  id!: string;

  @ApiProperty({ example: 'Bug report' })
  name!: string;

  @ApiProperty({ example: 'Bug: short issue summary' })
  title!: string;

  @ApiPropertyOptional({ example: 'Steps to reproduce...' })
  description?: string | null;

  @ApiProperty({ enum: TaskType, example: TaskType.BUG })
  type!: TaskType;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH })
  priority!: TaskPriority;

  @ApiProperty({ example: 'workspace-id' })
  workspaceId!: string;

  @ApiProperty({ type: TaskTemplateLabelResponseDto, isArray: true })
  labels!: TaskTemplateLabelResponseDto[];

  @ApiProperty({ example: 0 })
  usageCount!: number;

  @ApiPropertyOptional({ example: '2026-06-17T12:00:00.000Z' })
  lastUsedAt?: Date | null;

  @ApiProperty({ example: '2026-06-17T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-17T10:00:00.000Z' })
  updatedAt!: Date;
}
