import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, ValidateIf } from 'class-validator';

export class SetTaskMilestoneDto {
  @ApiPropertyOptional({
    example: '8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  milestoneId!: string | null;
}
