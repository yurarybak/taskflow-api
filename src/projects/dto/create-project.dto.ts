import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Project Alpha',
    minLength: 2,
    maxLength: 80,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({
    example: 'This is a sample project description',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
