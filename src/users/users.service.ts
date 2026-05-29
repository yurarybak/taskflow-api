import * as bcrypt from 'bcrypt';
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  updateProfile(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: updateUserDto,
    });
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.findById(id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { currentPassword, newPassword } = changePasswordDto;

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id,
        },
        data: {
          password: hashedNewPassword,
        },
      }),
      this.prisma.refreshToken.updateMany({
        where: {
          userId: id,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);
  }
}
