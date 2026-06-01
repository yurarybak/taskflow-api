import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsHexColor } from 'class-validator';

export class UpdateLabelDto {
  @ApiPropertyOptional({
    example: 'backend',
    minLength: 2,
    maxLength: 40,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  name?: string;

  @ApiPropertyOptional({
    example: '#2563EB',
  })
  @IsHexColor()
  color?: string;
}
