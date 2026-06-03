import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Response } from 'express';

import { UsersService } from './users.service';

@Controller('users')
export class AvatarsController {
  constructor(private readonly usersService: UsersService) {}

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
