import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateWorklogDto {
  @ApiPropertyOptional({
    example: 90,
    description: 'Time spent in minutes',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  timeSpentMinutes?: number;

  @ApiPropertyOptional({
    example: 'Updated worklog description',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: '2026-06-08T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional({
    example: 180,
    description: 'New remaining estimate in minutes',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  remainingEstimateMinutes?: number;
}
