import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleChecklistItemDto {
  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  isCompleted!: boolean;
}
