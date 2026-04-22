import {
    Controller, Get, Patch, Post,
    Body, UseGuards, UseInterceptors,
    UploadedFiles, Param, BadRequestException,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import { PostersService } from './posters.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { Permissions } from '../auth/decorators/permissions.decorator'
import type { PosterAreaKey } from './posters.service'

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov', '.ogg']

const storage = diskStorage({
    destination: join(process.cwd(), '..', 'uploads'),
    filename: (_, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
        cb(null, `${unique}${extname(file.originalname)}`)
    },
})

@Controller('posters')
export class PostersController {
    constructor(private readonly postersService: PostersService) {}

    @Get()
    findAll() {
        return this.postersService.findAll()
    }

    @Post('upload')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('edit_posters')
    @UseInterceptors(FilesInterceptor('files', 10, {
        storage,
        limits: { fileSize: 100 * 1024 * 1024 },
    }))
    uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided')
        }
        const urls = files.map(file => {
            const ext = extname(file.originalname).toLowerCase()
            if (!ALLOWED_EXT.includes(ext)) {
                throw new BadRequestException(`File type not allowed: ${ext}`)
            }
            return `/uploads/${file.filename}`
        })
        return { urls }
    }

    @Patch(':area')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('edit_posters')
    updateMedia(@Param('area') area: string, @Body() body: { media: string[] }) {
        const valid = ['TOP', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'INQUIRY']
        if (!valid.includes(area)) {
            throw new BadRequestException(`Invalid area: ${area}`)
        }
        return this.postersService.updateMedia(area as PosterAreaKey, body.media ?? [])
    }
}
