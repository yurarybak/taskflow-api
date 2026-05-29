import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the user',
  })
  id!: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'The email of the user',
  })
  email!: string;
  @ApiPropertyOptional({
    example: 'John',
    description: 'The first name of the user',
    minLength: 2,
    maxLength: 50,
  })
  firstName?: string | null;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'The last name of the user',
    minLength: 2,
    maxLength: 50,
  })
  lastName?: string | null;

  @ApiProperty({
    example: '2026-05-29T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-05-29T10:00:00.000Z',
  })
  updatedAt!: Date;
}
