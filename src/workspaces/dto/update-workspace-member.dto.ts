import { IsEnum, IsNotEmpty, NotEquals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '../../../generated/prisma/enums';

export class UpdateWorkspaceMemberDto {
  @ApiProperty({
    description: 'New role of the member',
    example: WorkspaceRole.MEMBER,
    enum: WorkspaceRole,
  })
  @IsNotEmpty()
  @IsEnum(WorkspaceRole)
  @NotEquals(WorkspaceRole.OWNER, {
    message: 'Role cannot be OWNER',
  })
  role!: WorkspaceRole;
}
