import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthUserResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    example: 'user@example.com',
  })
  email!: string;

  @ApiPropertyOptional({
    example: 'John',
  })
  firstName?: string | null;

  @ApiPropertyOptional({
    example: 'Doe',
  })
  lastName?: string | null;

  @ApiPropertyOptional({
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt?: Date;
}
