import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ForumGroupsService } from './forum-groups.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@Controller('forum/groups')
export class ForumGroupsController {
    constructor(private readonly service: ForumGroupsService) {}

    @Get()
    findAll(@Query('sectionId') sectionId?: string) {
        return this.service.findAll(sectionId)
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY', 'ADMIN')
    create(@Body() data: { sectionId: string; nameZh: string; nameEn: string; descriptionZh?: string; descriptionEn?: string }) {
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