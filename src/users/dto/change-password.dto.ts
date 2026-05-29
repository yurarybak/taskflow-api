import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'currentPassword123',
    description: 'The current password of the user',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'The new password of the user',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
