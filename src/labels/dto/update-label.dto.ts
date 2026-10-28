import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsHexColor,
  IsOptional,
} from 'class-validator';

export class UpdateLabelDto {
  @ApiPropertyOptional({
    example: 'backend',
    minLength: 2,
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  name?: string;

  @ApiPropertyOptional({
    example: '#2563EB',
  })
  @IsOptional()
  @IsHexColor()
  color?: string;
}
