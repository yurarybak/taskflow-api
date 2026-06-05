import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsDateString,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateMilestoneDto {
  @ApiProperty({
    example: 'MVP',
    minLength: 2,
    maxLength: 80,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({
    example: 'Initial release scope',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: '2026-06-10T09:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-06-30T18:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
