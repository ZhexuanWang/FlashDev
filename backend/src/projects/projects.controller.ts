import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, Query, UseGuards,
    UseInterceptors, UploadedFile,
    BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import { ProjectsService } from './projects.service'
import type { CreateProjectDto } from './dto/create-project.dto'
import type { UpdateProjectDto } from './dto/update-project.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov']

const storage = diskStorage({
    destination: join(process.cwd(), '..', 'uploads'),
    filename: (_, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
        cb(null, `${unique}${extname(file.originalname)}`)
    },
})

@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) {}

    // ── Public ──────────────────────────────────────────────
    @Get()
    findAll(
        @Query('categoryId') categoryId?: string,
        @Query('type') type?: string,
    ) {
        return this.projectsService.findAll(categoryId, type)
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.projectsService.findOne(id)
    }

    // ── Admin/Company ────────────────────────────────────────
    @Get('admin/all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY', 'ADMIN')
    findAllAdmin() {
        return this.projectsService.findAllAdmin()
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY', 'ADMIN')
    create(@Body() dto: CreateProjectDto) {
        return this.projectsService.create(dto)
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY', 'ADMIN')
    update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
        return this.projectsService.update(id, dto)
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY', 'ADMIN')
    remove(@Param('id') id: string) {
        return this.projectsService.remove(id)
    }

    // ── File Upload ──────────────────────────────────────────
    @Post('upload')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('COMPANY', 'ADMIN')
    @UseInterceptors(FileInterceptor('file', { storage, limits: { fileSize: 50 * 1024 * 1024 } }))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file provided')
        const ext = extname(file.originalname).toLowerCase()
        if (!ALLOWED_EXT.includes(ext)) {
            throw new BadRequestException(`File type not allowed: ${ext}`)
        }
        return { url: `/uploads/${file.filename}` }
    }
}