import { Controller, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common'
import { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles }      from '../auth/roles.decorator'
import { UsersService } from './users.service'

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @UseGuards(RolesGuard)
    @Roles('COMPANY')
    findAll() {
        return this.usersService.findAll()
    }

    @Get('me')
    getMe(@Req() req: Request) {
        const userId = (req.user as { userId: string }).userId
        return this.usersService.findMe(userId)
    }

    @Patch('me')
    updateProfile(@Req() req: Request, @Body() body: { phone?: string; avatar?: string; bio?: string }) {
        const userId = (req.user as { userId: string }).userId
        return this.usersService.updateProfile(userId, body)
    }

    @Patch(':id/permissions')
    @UseGuards(RolesGuard)
    @Roles('COMPANY')
    updatePermissions(
        @Param('id') id: string,
        @Body() body: { permissions: Record<string, boolean> },
    ) {
        return this.usersService.updatePermissions(id, body.permissions)
    }

    @Patch(':id/active')
    @UseGuards(RolesGuard)
    @Roles('COMPANY')
    setActive(
        @Param('id') id: string,
        @Body() body: { isActive: boolean },
    ) {
        return this.usersService.setActive(id, body.isActive)
    }
}