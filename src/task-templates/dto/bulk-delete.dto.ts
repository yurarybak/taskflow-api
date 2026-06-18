import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsArray } from 'class-validator';

export class BulkDeleteDto {
  @ApiProperty({
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  ids!: string[];
}
