import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'The refresh token used to obtain a new access token.',
    example: 'eyJhbGciOi...',
  })
  @IsString()
  refreshToken!: string;
}
