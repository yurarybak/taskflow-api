import { Controller, UseGuards, Get, Patch, Body } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';

import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/response/user-response.dto';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('/me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiOkResponse({
    description: 'The current user has been successfully retrieved',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found' })
  getCurrentUser(@GetCurrentUser() user: UserResponseDto) {
    return this.usersService.findById(user.id);
  }

  @Patch('/me')
  @ApiOperation({ summary: 'Update current user' })
  @ApiOkResponse({
    description: 'The current user has been successfully updated',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found' })
  updateProfile(
    @GetCurrentUser() user: UserResponseDto,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, updateUserDto);
  }
}
