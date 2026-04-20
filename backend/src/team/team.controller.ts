import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, UseGuards,
    UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import { TeamService } from './team.service'
import type { CreateTeamMemberDto } from './dto/create-team-member.dto'
import type { UpdateTeamMemberDto } from './dto/update-team-member.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

const storage = diskStorage({
    destination: join(process.cwd(), '..', 'uploads'),
    filename: (_, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
        cb(null, `avatar-${unique}${extname(file.originalname)}`)
    },
})

@Controller('team')
export class TeamController {
    constructor(private readonly teamService: TeamService) {}

    @Get()
    findAll() { return this.teamService.findAll() }

    @Get('admin/all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY', 'ADMIN')
    findAllAdmin() { return this.teamService.findAllAdmin() }

    @Get(':id')
    findOne(@Param('id') id: string) { return this.teamService.findOne(id) }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY')
    create(@Body() dto: CreateTeamMemberDto) { return this.teamService.create(dto) }

    @Patch('reorder')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY', 'ADMIN')
    reorder(@Body() body: { items: { id: string; order: number }[] }) {
        return this.teamService.reorder(body.items)
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY', 'ADMIN')
    update(@Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
        return this.teamService.update(id, dto)
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY')
    remove(@Param('id') id: string) { return this.teamService.remove(id) }

    @Post('upload/avatar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY', 'ADMIN')
    @UseInterceptors(FileInterceptor('file', {
        storage,
        limits: { fileSize: 5 * 1024 * 1024 },
    }))
    uploadAvatar(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file provided')
        const allowed = ['.jpg', '.jpeg', '.png', '.webp']
        if (!allowed.includes(extname(file.originalname).toLowerCase())) {
            throw new BadRequestException('Only image files allowed')
        }
        return { url: `/uploads/${file.filename}` }
    }
}