import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSavedTaskFilterDto {
  @ApiProperty({
    example: 'My bugs filter',
    minLength: 2,
    maxLength: 80,
  })
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
  @IsObject()
  filters!: Record<string, unknown>;
}
