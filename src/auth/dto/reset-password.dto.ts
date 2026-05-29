import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'The token for resetting the password',
    example: 'some-random-token',
  })
  @IsString()
  token!: string;

  @ApiProperty({
    description: 'The new password for the user',
    example: 'newStrongPassword123',
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
