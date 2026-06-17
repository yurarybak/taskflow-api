import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  ValidateIf,
  IsUUID,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateTaskFromTemplateDto {
  @ApiProperty({
    example: '',
  })
  @IsString()
  templateId!: string;

  @ApiPropertyOptional({
    example: 'Implement JWT authentication',
    minLength: 2,
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
