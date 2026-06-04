import { ApiProperty } from '@nestjs/swagger';

export class ChecklistItemResponseDto {
  @ApiProperty({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
  })
  id!: string;

  @ApiProperty({
    example: 'Create DTO',
  })
  title!: string;

  @ApiProperty({
    example: false,
  })
  isCompleted!: boolean;

  @ApiProperty({
    example: 0,
  })
  position!: number;

  @ApiProperty({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
  })
  taskId!: string;

  @ApiProperty({
    example: '2026-06-04T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-06-04T10:00:00.000Z',
  })
  updatedAt!: Date;
}
