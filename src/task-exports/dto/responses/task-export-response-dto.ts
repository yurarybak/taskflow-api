import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { TaskExportStatus } from '../../../../generated/prisma/enums';

export class TaskExportResponseDto {
  @ApiProperty({ example: 'export-id' })
  id!: string;

  @ApiProperty({ enum: TaskExportStatus, example: TaskExportStatus.PENDING })
  status!: TaskExportStatus;

  @ApiPropertyOptional({ example: 'taskflow-tasks-2026-06-12.csv' })
  fileName?: string | null;

  @ApiPropertyOptional({ example: 'export-id.csv' })
  storageName?: string | null;

  @ApiPropertyOptional({ example: 'Failed to generate CSV file' })
  error?: string | null;

  @ApiProperty({ example: 'project-id' })
  projectId!: string;

  @ApiProperty({ example: 'user-id' })
  userId!: string;

  @ApiProperty({ example: '2026-06-12T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-12T10:00:00.000Z' })
  updatedAt!: Date;

  @ApiPropertyOptional({ example: '2026-06-12T10:01:00.000Z' })
  completedAt?: Date | null;

  @ApiPropertyOptional({
    example: {
      statuses: ['TODO'],
      includeArchived: false,
    },
  })
  filters?: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: 'task-export-export-id' })
  jobId?: string | null;
}
