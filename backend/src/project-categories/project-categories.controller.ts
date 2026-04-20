import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common'
import { ProjectCategoriesService } from './project-categories.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@Controller('project-categories')
export class ProjectCategoriesController {
    constructor(private svc: ProjectCategoriesService) {}

    @Get()
    findAll() { return this.svc.findAll() }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY')
    create(@Body() body: { nameZh: string; nameEn: string; icon: string }) {
        return this.svc.create(body.nameZh, body.nameEn, body.icon)
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY')
    remove(@Param('id') id: string) { return this.svc.remove(id) }
}