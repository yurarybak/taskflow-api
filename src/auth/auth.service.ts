import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import type { StringValue } from 'ms';

import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailQueueService } from '../queues/email-queue/email-queue.service';
import type { PrismaTransactionClient } from '../prisma/types/prisma-transaction-client.type';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import type { JwtPayload } from './types/jwt-payload.type';
import type { CurrentUser } from './types/current-user.type';
import type { PasswordResetPayload } from './types/password-reset-payload.type';
import type { AuthResponse } from './types/auth-response.type';
import type { PublicUser } from '../common/types/user-summary.type';
import { toPublicUser } from '../common/utils/public-user.util';

// bcrypt hash (cost 10) of a random string nobody knows.
const DUMMY_PASSWORD_HASH =
  '$2b$10$ssjfQXNKDWtHSYwCwubofOFgsquVqCSvPmcqgzec/pgIDou./rLDq';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    return this.createAuthResponse(toPublicUser(user));
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);

    // Unknown emails are still checked against a dummy hash with the same cost, so
    // response time doesn't reveal which emails are registered.
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user?.password ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createAuthResponse(toPublicUser(user));
  }

  private async generateAccessToken(user: CurrentUser): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.signAsync(payload);
  }

  private async generateRefreshToken(user: CurrentUser): Promise<string> {
    // jti keeps tokens issued in the same second distinct (tokenHash is unique).
    const payload = {
      sub: user.id,
      email: user.email,
      jti: randomUUID(),
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<StringValue>(
        'JWT_REFRESH_EXPIRES_IN',
      ),
    });
  }

  private async generateResetPasswordToken(user: CurrentUser): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      purpose: 'password_reset',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>(
        'JWT_RESET_PASSWORD_SECRET',
      ),
      expiresIn: this.configService.getOrThrow<StringValue>(
        'JWT_RESET_PASSWORD_EXPIRES_IN',
      ),
    });
  }

  private getRefreshTokenExpiresAt(): Date {
    const expiresIn = this.configService.getOrThrow<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );

    const match = expiresIn.match(/^(\d+)([dhm])$/);

    if (!match) {
      throw new Error('Invalid JWT_REFRESH_EXPIRES_IN format');
    }

    const value = Number(match[1]);
    const unit = match[2];

    const expiresAt = new Date();

    if (unit === 'd') {
      expiresAt.setDate(expiresAt.getDate() + value);
    }

    if (unit === 'h') {
      expiresAt.setHours(expiresAt.getHours() + value);
    }

    if (unit === 'm') {
      expiresAt.setMinutes(expiresAt.getMinutes() + value);
    }

    return expiresAt;
  }

  // A refresh token is a high-entropy signed JWT, so a fast deterministic hash is enough
  // and lets us look it up by its unique hash. bcrypt only reads the first 72 bytes,
  // which are identical for all JWTs of one user.
  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private async createRefreshToken(
    user: CurrentUser,
    familyId: string,
    tx: PrismaTransactionClient = this.prisma,
  ): Promise<{ id: string; refreshToken: string }> {
    const refreshToken = await this.generateRefreshToken(user);

    const { id } = await tx.refreshToken.create({
      data: {
        tokenHash: this.hashRefreshToken(refreshToken),
        familyId,
        userId: user.id,
        expiresAt: this.getRefreshTokenExpiresAt(),
      },
      select: { id: true },
    });

    return { id, refreshToken };
  }

  private async createAuthResponse(user: PublicUser): Promise<AuthResponse> {
    const [accessToken, { refreshToken }] = await Promise.all([
      this.generateAccessToken(user),
      this.createRefreshToken(user, randomUUID()),
    ]);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshTokenDto.refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashRefreshToken(refreshTokenDto.refreshToken) },
    });

    if (
      !storedToken ||
      storedToken.userId !== payload.sub ||
      storedToken.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      // An already rotated token is being replayed: either it was stolen or the
      // legitimate client was, so end the whole session (token family).
      if (storedToken.replacedById) {
        await this.revokeRefreshTokenFamily(storedToken.familyId);
      }

      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const { id: newTokenId, refreshToken } = await this.createRefreshToken(
        user,
        storedToken.familyId,
        tx,
      );

      // The revokedAt guard makes rotation atomic: of two concurrent refreshes
      // with the same token only one updates the row.
      const { count } = await tx.refreshToken.updateMany({
        where: { id: storedToken.id, revokedAt: null },
        data: { revokedAt: new Date(), replacedById: newTokenId },
      });

      if (count === 0) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        accessToken: await this.generateAccessToken(user),
        refreshToken,
        user,
      };
    });
  }

  private async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logout(
    userId: string,
    refreshTokenDto: RefreshTokenDto,
  ): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: this.hashRefreshToken(refreshTokenDto.refreshToken),
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      return;
    }

    const resetToken = await this.generateResetPasswordToken(user);

    const fullName =
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      'TaskFlow user';

    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    await this.emailQueueService.addSendPasswordResetEmailJob({
      to: user.email,
      fullName,
      resetLink,
    });
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    let payload: PasswordResetPayload;

    try {
      payload = await this.jwtService.verifyAsync<PasswordResetPayload>(
        resetPasswordDto.token,
        {
          secret: this.configService.getOrThrow<StringValue>(
            'JWT_RESET_PASSWORD_SECRET',
          ),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.purpose !== 'password_reset') {
      throw new UnauthorizedException('Invalid reset token');
    }

    const user = await this.usersService.findByEmail(payload.email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isSamePassword = await bcrypt.compare(
      resetPasswordDto.newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: hashedPassword,
        },
      }),
      this.prisma.refreshToken.updateMany({
        where: {
          userId: user.id,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);
  }
}
