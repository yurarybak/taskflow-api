import { Controller, UseGuards, Get, Patch, Body } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';

import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/responses/user-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get current user' })
  @ApiOkResponse({
    description: 'The current user has been successfully retrieved',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Get('/me')
  getCurrentUser(@GetCurrentUser() user: UserResponseDto) {
    return this.usersService.findById(user.id);
  }

  @ApiOperation({ summary: 'Update current user' })
  @ApiOkResponse({
    description: 'The current user has been successfully updated',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Patch('/me')
  updateProfile(
    @GetCurrentUser() user: UserResponseDto,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, updateUserDto);
  }

  @ApiOperation({ summary: 'Change current user password' })
  @ApiOkResponse({
    description: 'The current user password has been successfully changed',
    type: SuccessResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Patch('/me/password')
  async changePassword(
    @GetCurrentUser() user: UserResponseDto,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(user.id, changePasswordDto);

    return {
      success: true,
    };
  }
}
