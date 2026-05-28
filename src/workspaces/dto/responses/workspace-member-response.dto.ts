import { ApiProperty } from '@nestjs/swagger';

import { WorkspaceRole } from '../../../../generated/prisma/enums';
import { AuthUserResponseDto } from '../../../auth/dto/responses/auth-user-response.dto';

export class WorkspaceMemberResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  workspaceId!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId!: string;

  @ApiProperty({
    example: WorkspaceRole.MEMBER,
    enum: WorkspaceRole,
  })
  role!: WorkspaceRole;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;

  @ApiProperty({
    type: AuthUserResponseDto,
  })
  user!: AuthUserResponseDto;
}
