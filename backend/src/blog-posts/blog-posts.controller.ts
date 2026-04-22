import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, Query, UseGuards,
    UseInterceptors, UploadedFile,
    BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import { BlogPostsService } from './blog-posts.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { Permissions } from '../auth/decorators/permissions.decorator'

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

const storage = diskStorage({
    destination: join(process.cwd(), '..', 'uploads'),
    filename: (_, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
        cb(null, `${unique}${extname(file.originalname)}`)
    },
})

@Controller('blogs')
export class BlogPostsController {
    constructor(private readonly blogPostsService: BlogPostsService) {}

    // ── Public ──────────────────────────────────────────────
    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('tag') tag?: string,
    ) {
        return this.blogPostsService.findAll({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            tag,
        })
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.blogPostsService.findOne(id)
    }

    // ── Admin/Company ────────────────────────────────────────
    @Get('admin/all')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('manage_blogs')
    findAllAdmin(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.blogPostsService.findAllAdmin({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        })
    }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('manage_blogs')
    create(
        @Body() rawBody: Record<string, unknown>,
        @Body('authorId') _authorId?: string,
    ) {
        return this.blogPostsService.create({
            titleZh:    (rawBody.titleZh    as string) ?? '',
            titleEn:    (rawBody.titleEn    as string) ?? '',
            excerptZh:  (rawBody.excerptZh  as string) ?? '',
            excerptEn:  (rawBody.excerptEn  as string) ?? '',
            coverImage: rawBody.coverImage as string | undefined,
            tags:       (rawBody.tags       as string[]) ?? [],
            isPublished:(rawBody.isPublished as boolean) ?? false,
        })
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('manage_blogs')
    update(@Param('id') id: string, @Body() rawBody: Record<string, unknown>) {
        return this.blogPostsService.update(id, rawBody)
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('manage_blogs')
    remove(@Param('id') id: string) {
        return this.blogPostsService.remove(id)
    }

    // ── Cover Image Upload ─────────────────────────────────────────
    @Post('upload/cover')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('manage_blogs')
    @UseInterceptors(FileInterceptor('file', { storage, limits: { fileSize: 10 * 1024 * 1024 } }))
    uploadCover(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file provided')
        const ext = extname(file.originalname).toLowerCase()
        if (!ALLOWED_EXT.includes(ext)) {
            throw new BadRequestException(`File type not allowed: ${ext}`)
        }
        return { url: `/uploads/${file.filename}` }
    }
}
