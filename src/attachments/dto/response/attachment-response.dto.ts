import { ApiProperty } from '@nestjs/swagger';

export class AttachmentResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    example: 'design-mockup.png',
  })
  originalName!: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.png',
  })
  storageName!: string;

  @ApiProperty({
    example: 'image/png',
  })
  mimeType!: string;

  @ApiProperty({
    example: 1024,
  })
  size!: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  taskId!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  uploaderId!: string;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt!: Date;
}
