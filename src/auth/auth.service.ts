import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';

import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from 'src/email/email.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import type { JwtPayload } from './types/jwt-payload.type';
import type { CurrentUser } from './types/current-user.type';
import type { PasswordResetPayload } from './types/password-reset-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) { }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const { password, ...safeUser } = user;

    return this.createAuthResponse(safeUser);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new ConflictException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new ConflictException('Invalid credentials');
    }

    const { password, ...safeUser } = user;

    return this.createAuthResponse(safeUser);
  }

  private async generateAccessToken(user: CurrentUser) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.signAsync(payload);
  }

  private async generateRefreshToken(user: CurrentUser) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<StringValue>(
        'JWT_REFRESH_EXPIRES_IN',
      ),
    });
  }

  private async generateResetPasswordToken(user: CurrentUser) {
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

  private getRefreshTokenExpiresAt() {
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

  private async createRefreshToken(user: CurrentUser) {
    const refreshToken = await this.generateRefreshToken(user);
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: this.getRefreshTokenExpiresAt(),
      },
    });

    return refreshToken;
  }

  private async createAuthResponse(user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.createRefreshToken(user),
    ]);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
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

    const refreshTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    const matchingToken = this.findMatchingRefreshToken(
      refreshTokenDto.refreshToken,
      refreshTokens,
    );

    if (!matchingToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: matchingToken.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.usersService.findByEmail(payload.email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...safeUser } = user;

    return this.createAuthResponse(safeUser);
  }

  private findMatchingRefreshToken(
    refreshToken: string,
    refreshTokens: { id: string; tokenHash: string }[],
  ) {
    for (const storedRefreshToken of refreshTokens) {
      if (bcrypt.compareSync(refreshToken, storedRefreshToken.tokenHash)) {
        return storedRefreshToken;
      }
    }
    return null;
  }

  async logout(refreshTokenDto: RefreshTokenDto) {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshTokenDto.refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      return;
    }

    const refreshTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
      },
    });

    const matchingToken = this.findMatchingRefreshToken(
      refreshTokenDto.refreshToken,
      refreshTokens,
    );

    if (matchingToken) {
      await this.prisma.refreshToken.update({
        where: { id: matchingToken.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  async logoutAll(userId: string) {
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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      return;
    }

    const resetToken = await this.generateResetPasswordToken(user);

    this.emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
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
