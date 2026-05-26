import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceRole } from '../../../generated/prisma/enums';

export class AddWorkspaceMemberDto {
  @ApiProperty({
    description: 'Email of the user to add to the workspace',
    example: 'example@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    description: 'Role of the user in the workspace',
    example: WorkspaceRole.MEMBER,
    enum: WorkspaceRole,
    default: WorkspaceRole.MEMBER,
  })
  @IsOptional()
  @IsEnum(WorkspaceRole)
  role?: WorkspaceRole = WorkspaceRole.MEMBER;
}
