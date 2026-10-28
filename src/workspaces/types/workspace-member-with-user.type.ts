import type { WorkspaceMember } from '../../../generated/prisma/client';
import type { PublicUser } from '../../common/types/user-summary.type';

export interface WorkspaceMemberWithUser extends WorkspaceMember {
  user: PublicUser;
}
