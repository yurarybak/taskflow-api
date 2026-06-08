import { ApiProperty } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateSavedTaskFilterDto {
  @ApiProperty({
    example: 'My updated bugs filter',
    minLength: 2,
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({
    example: {
      statuses: ['TODO'],
      priorities: ['HIGH'],
      types: ['BUG'],
      milestones: ['Auth', 'JWT'],
    },
  })
  @IsOptional()
  @IsObject()
  filters!: Record<string, unknown>;
}
