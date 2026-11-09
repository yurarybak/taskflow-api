import type { Prisma, User } from '../../../generated/prisma/client';
import type { PublicUser } from '../types/user-summary.type';

// Fields are listed explicitly so a new User column never reaches responses by default.
export const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export function toPublicUser(user: User): PublicUser {
  const { id, email, firstName, lastName, createdAt, updatedAt } = user;

  return { id, email, firstName, lastName, createdAt, updatedAt };
}
