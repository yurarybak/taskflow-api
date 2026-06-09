import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateWorklogDto {
  @ApiProperty({
    example: 120,
    description: 'Time spent in minutes',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  timeSpentMinutes!: number;

  @ApiPropertyOptional({
    example: 'Implemented DTO and service methods',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: '2026-06-08T10:00:00.000Z',
  })
  @IsDateString()
  startedAt!: string;

  @ApiPropertyOptional({
    example: 240,
    description: 'New remaining estimate in minutes',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  remainingEstimateMinutes?: number;
}
