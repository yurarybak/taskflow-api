import {
  ConflictException,
  Injectable,
  // UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';

import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
// import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

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

  private async generateAccessToken(user: { id: string; email: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.signAsync(payload);
  }

  private async generateRefreshToken(user: { id: string; email: string }) {
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

  private async createRefreshToken(user: { id: string; email: string }) {
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
}
