import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CreateUserInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  create(data: CreateUserInput) {
    return this.prisma.user.create({
      data,
    });
  }
}
