import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles }      from '../auth/roles.decorator'
import { UsersService } from './users.service'

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @Roles('COMPANY')
    findAll() {
        return this.usersService.findAll()
    }

    @Patch(':id/permissions')
    @Roles('COMPANY')
    updatePermissions(
        @Param('id') id: string,
        @Body() body: { permissions: Record<string, boolean> },
    ) {
        return this.usersService.updatePermissions(id, body.permissions)
    }

    @Patch(':id/active')
    @Roles('COMPANY')
    setActive(
        @Param('id') id: string,
        @Body() body: { isActive: boolean },
    ) {
        return this.usersService.setActive(id, body.isActive)
    }
}