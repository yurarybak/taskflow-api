import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { GetCurrentUser } from './decorators/get-current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/responses/auth-response.dto';
import { AuthUserResponseDto } from './dto/responses/auth-user-response.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import type { CurrentUser } from './types/current-user.type';
import type { AuthResponse } from './types/auth-response.type';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiTooManyRequestsResponse({
    description: 'Too many requests, try again later',
  })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiConflictResponse({ description: 'Email already in use' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @ApiTooManyRequestsResponse({
    description: 'Too many requests, try again later',
  })
  @ApiOperation({ summary: 'Login a user' })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Successful login',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiOkResponse({ type: AuthUserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@GetCurrentUser() user: CurrentUser): CurrentUser {
    return user;
  }

  @ApiTooManyRequestsResponse({
    description: 'Too many requests, try again later',
  })
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponse> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @ApiOperation({ summary: 'Logout a user by invalidating the refresh token' })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ success: boolean }> {
    // Invalidate the refresh token in the database
    await this.authService.logout(refreshTokenDto);
    return {
      success: true,
    };
  }

  @ApiOperation({
    summary: 'Logout from all sessions by invalidating all refresh tokens',
  })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  @Post('logout-all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @GetCurrentUser() user: CurrentUser,
  ): Promise<{ success: boolean }> {
    // Invalidate all refresh tokens for the user in the database
    await this.authService.logoutAll(user.id);
    return {
      success: true,
    };
  }

  @ApiTooManyRequestsResponse({
    description: 'Too many requests, try again later',
  })
  @ApiOperation({ summary: 'Request password reset' })
  @ApiOkResponse({ type: SuccessResponseDto })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ success: boolean }> {
    await this.authService.forgotPassword(forgotPasswordDto);
    return {
      success: true,
    };
  }

  @ApiTooManyRequestsResponse({
    description: 'Too many requests, try again later',
  })
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    await this.authService.resetPassword(resetPasswordDto);
    return {
      success: true,
    };
  }
}
