import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MinLength, MaxLength, IsString, IsOptional } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({
    example: 'Personal Workspace',
    minLength: 2,
    maxLength: 80,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({
    example: 'My personal task management workspace',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
