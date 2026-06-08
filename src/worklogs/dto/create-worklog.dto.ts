import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  Min,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class CreateWorklogDto {
  @IsInt()
  @Min(0)
  timeSpentMinutes!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startedAt!: string;
}
