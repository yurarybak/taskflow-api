import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @ApiPropertyOptional({
    example: 'Updated Project Alpha',
    minLength: 2,
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated description for the project',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
