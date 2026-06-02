import { ApiProperty } from '@nestjs/swagger';

export class AvatarResponseDto {
  @ApiProperty({
    example:
      'http://localhost:3000/users/8c7b7b4e-3e7a-4f90-91a5-7a4f6f7c7c10/avatar',
  })
  avatarUrl!: string;
}
