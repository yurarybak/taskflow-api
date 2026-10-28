import type { User } from '../../../generated/prisma/client';

/** Minimal user fields embedded in task-related responses. */
export type UserSummary = Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;

/** User without credentials and storage internals. */
export type PublicUser = Omit<User, 'password' | 'avatarStorageName'>;
