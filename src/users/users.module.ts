import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AvatarsController } from './avatars.controller';

@Module({
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController, AvatarsController],
})
export class UsersModule {}
