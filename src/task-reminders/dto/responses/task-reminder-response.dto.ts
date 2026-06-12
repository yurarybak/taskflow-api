import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaskReminderResponseDto {
  @ApiProperty({ example: 'reminder-id' })
  id!: string;

  @ApiProperty({ example: '2026-06-12T09:00:00.000Z' })
  remindAt!: Date;

  @ApiPropertyOptional({ example: '2026-06-12T09:00:00.000Z' })
  sentAt?: Date | null;

  @ApiProperty({ example: 'task-id' })
  taskId!: string;

  @ApiProperty({ example: 'user-id' })
  userId!: string;

  @ApiPropertyOptional({ example: 'task-reminder-reminder-id' })
  jobId?: string | null;

  @ApiProperty({ example: '2026-06-11T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-11T10:00:00.000Z' })
  updatedAt!: Date;
}
