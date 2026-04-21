import {
    Controller, Get, Patch, Body, UseGuards,
    Param, BadRequestException,
} from '@nestjs/common'
import { PostersService } from './posters.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { Permissions } from '../auth/decorators/permissions.decorator'
import type { PosterAreaKey } from './posters.service'

@Controller('posters')
export class PostersController {
    constructor(private readonly postersService: PostersService) {}

    @Get()
    findAll() {
        return this.postersService.findAll()
    }

    @Patch(':area')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('edit_posters')
    updateMedia(@Param('area') area: string, @Body() body: { media: string[] }) {
        const valid = ['TOP', 'BOTTOM_LEFT', 'BOTTOM_RIGHT']
        if (!valid.includes(area)) {
            throw new BadRequestException(`Invalid area: ${area}`)
        }
        return this.postersService.updateMedia(area as PosterAreaKey, body.media ?? [])
    }
}
