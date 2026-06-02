import * as bcrypt from 'bcrypt';
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
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

  private async removeAvatarFromStorage(storageName: string) {
    try {
      const avatarPath = join(process.cwd(), 'uploads', 'avatars', storageName);

      // Remove the file
      await unlink(avatarPath);
    } catch (error) {
      // Log the error but do not throw, since the main operation (like deleting the database record) has already succeeded
      console.error(`Failed to delete file from storage: ${error}`);
    }
  }

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

  async uploadAvatar(id: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        avatarStorageName: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const oldAvatarStorageName = user.avatarStorageName;

    try {
      await this.prisma.user.update({
        where: {
          id,
        },
        data: {
          avatarStorageName: file.filename,
        },
      });
    } catch (error) {
      // If there's an error during the database operation, remove the uploaded file to prevent orphaned files
      await this.removeAvatarFromStorage(file.filename);
      throw error;
    }

    if (oldAvatarStorageName) {
      await this.removeAvatarFromStorage(oldAvatarStorageName);
    }
  }

  async removeAvatar(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        avatarStorageName: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const avatarStorageName = user.avatarStorageName;

    if (!avatarStorageName) {
      throw new BadRequestException('User does not have an avatar to delete');
    }

    await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        avatarStorageName: null,
      },
    });

    await this.removeAvatarFromStorage(avatarStorageName);
  }
}
