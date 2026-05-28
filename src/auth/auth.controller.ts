import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { GetCurrentUser } from './decorators/get-current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/responses/auth-response.dto';
import { AuthUserResponseDto } from './dto/responses/auth-user-response.dto';
import { SuccessResponseDto } from './dto/responses/success-response.dto';

import type { CurrentUser } from './types/current-user.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiConflictResponse({ description: 'Email already in use' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Login a user' })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Successful login',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiOkResponse({ type: AuthUserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@GetCurrentUser() user: CurrentUser) {
    return user;
  }

  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @ApiOperation({ summary: 'Logout a user by invalidating the refresh token' })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    // Invalidate the refresh token in the database
    return this.authService.logout(refreshTokenDto);
  }

  @ApiOperation({
    summary: 'Logout from all sessions by invalidating all refresh tokens',
  })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('logout-all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logoutAll(@GetCurrentUser() user: CurrentUser) {
    // Invalidate all refresh tokens for the user in the database
    return this.authService.logoutAll(user.id);
  }
}
