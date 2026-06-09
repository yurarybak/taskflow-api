import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { NotificationType } from '../../../../generated/prisma/enums';

export class NotificationResponseDto {
  @ApiProperty({ example: 'notification-id' })
  id!: string;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.TASK_ASSIGNED,
  })
  type!: NotificationType;

  @ApiProperty({ example: 'You were assigned to a task' })
  title!: string;

  @ApiPropertyOptional({ example: 'Task: Implement auth flow' })
  message?: string | null;

  @ApiPropertyOptional({
    example: {
      taskId: 'task-id',
      projectId: 'project-id',
    },
  })
  data?: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: '2026-06-09T10:00:00.000Z' })
  readAt?: Date | null;

  @ApiProperty({ example: 'user-id' })
  userId!: string;

  @ApiProperty({ example: '2026-06-09T10:00:00.000Z' })
  createdAt!: Date;
}
