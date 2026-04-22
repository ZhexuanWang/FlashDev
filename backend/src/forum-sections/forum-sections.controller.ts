import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common'
import { ForumSectionsService } from './forum-sections.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@Controller('forum/sections')
export class ForumSectionsController {
    constructor(private readonly service: ForumSectionsService) {}

    @Get()
    findAll() { return this.service.findAll() }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY', 'ADMIN')
    create(@Body() data: { nameZh: string; nameEn: string; descriptionZh?: string; descriptionEn?: string; icon?: string }) {
        return this.service.create(data)
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY', 'ADMIN')
    update(@Param('id') id: string, @Body() data: Record<string, unknown>) {
        return this.service.update(id, data)
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY', 'ADMIN')
    remove(@Param('id') id: string) { return this.service.remove(id) }
}