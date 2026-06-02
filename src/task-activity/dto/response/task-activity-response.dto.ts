import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskActivityType } from '../../../../generated/prisma/enums';

class TaskActivityActorResponseDto {
  @ApiProperty({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
  })
  id!: string;

  @ApiProperty({
    example: 'test@example.com',
  })
  email!: string;

  @ApiPropertyOptional({
    example: 'John',
    nullable: true,
  })
  firstName?: string | null;

  @ApiPropertyOptional({
    example: 'Doe',
    nullable: true,
  })
  lastName?: string | null;
}

export class TaskActivityResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the task activity log entry',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Type of activity performed on the task',
    enum: TaskActivityType,
    example: TaskActivityType.STATUS_CHANGED,
  })
  type!: TaskActivityType;

  @ApiProperty({
    description: 'Identifier of the task associated with this activity',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  taskId!: string;

  @ApiProperty({
    description: 'Identifier of the user associated with this activity',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId!: string;

  @ApiProperty({
    description: 'Details about the user who performed the activity',
    type: TaskActivityActorResponseDto,
  })
  actor!: TaskActivityActorResponseDto;

  @ApiProperty({
    example: '2026-06-02T10:00:00.000Z',
  })
  createdAt!: Date;
}
