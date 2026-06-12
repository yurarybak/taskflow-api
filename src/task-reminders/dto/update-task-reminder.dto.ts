import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class UpdateTaskReminderDto {
  @ApiProperty({ example: '2026-06-12T09:00:00.000Z' })
  @IsDateString()
  remindAt!: string;
}
