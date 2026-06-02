import {
  Controller,
  UseGuards,
  Get,
  Patch,
  Body,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  Delete,
  Param,
  Res,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { avatarStorage } from './config/avatar-storage.config';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/responses/user-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SuccessResponseDto } from '../common/dto/responses/success-response.dto';
import { AvatarResponseDto } from './dto/responses/avatar-response.dto';

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

  @ApiOperation({ summary: 'Upload current user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({
    description: 'The current user avatar has been successfully uploaded',
    type: AvatarResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: avatarStorage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_request, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(new Error('Only image files are allowed'), false);
        }

        callback(null, true);
      },
    }),
  )
  @Post('/me/avatar')
  async uploadAvatar(
    @GetCurrentUser() user: UserResponseDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    const avatarUrl = await this.usersService.uploadAvatar(user.id, file);

    return {
      avatarUrl,
    };
  }

  @ApiOperation({ summary: 'Delete current user avatar' })
  @ApiOkResponse({
    description: 'The current user avatar has been successfully deleted',
    type: SuccessResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Delete('/me/avatar')
  async removeAvatar(@GetCurrentUser() user: UserResponseDto) {
    await this.usersService.removeAvatar(user.id);

    return {
      success: true,
    };
  }

  @ApiOperation({ summary: 'Get user avatar' })
  @ApiOkResponse({
    description: 'Avatar image returned successfully',
  })
  @ApiNotFoundResponse({
    description: 'Avatar not found',
  })
  @Get(':id/avatar')
  async getAvatar(@Param('id') id: string, @Res() response: Response) {
    const storageName = await this.usersService.findAvatar(id);

    const filePath = join(process.cwd(), 'uploads', 'avatars', storageName);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Avatar file not found');
    }

    return response.sendFile(filePath);
  }
}
