import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsHexColor } from 'class-validator';

export class CreateLabelDto {
  @ApiProperty({
    example: 'backend',
    minLength: 2,
    maxLength: 40,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  name!: string;

  @ApiProperty({
    example: '#2563EB',
  })
  @IsHexColor()
  color!: string;
}
