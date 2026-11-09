import type { PublicUser } from '../../common/types/user-summary.type';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}
