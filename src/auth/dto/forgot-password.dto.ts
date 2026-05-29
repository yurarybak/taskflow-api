import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'The email of the user who forgot their password',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;
}
