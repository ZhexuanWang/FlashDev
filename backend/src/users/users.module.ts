import { Module } from '@nestjs/common'
import { UsersService }    from './users.service'
import { UsersController } from './users.controller'

@Module({
    controllers: [UsersController],
    providers:   [UsersService],
    exports:     [UsersService],   // AuthModule 需要用到
})
export class UsersModule {}