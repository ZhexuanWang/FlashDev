import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, UseGuards,
} from '@nestjs/common'
import { BlogBlocksService } from './blog-blocks.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { CreateBlogBlockDto, UpdateBlogBlockDto, ReorderBlogBlocksDto } from './dto/create-blog-block.dto'

@Controller('blogs/:postId/blocks')
export class BlogBlocksController {
    constructor(private readonly blocksService: BlogBlocksService) {}

    @Get()
    findAll(@Param('postId') postId: string) {
        return this.blocksService.findAllByPost(postId)
    }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('manage_blogs')
    create(@Param('postId') postId: string, @Body() dto: CreateBlogBlockDto) {
        return this.blocksService.create(postId, dto)
    }

    @Patch(':blockId')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('manage_blogs')
    update(
        @Param('postId') postId: string,
        @Param('blockId') blockId: string,
        @Body() dto: UpdateBlogBlockDto,
    ) {
        return this.blocksService.update(postId, blockId, dto)
    }

    @Delete(':blockId')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('manage_blogs')
    remove(@Param('postId') postId: string, @Param('blockId') blockId: string) {
        return this.blocksService.remove(postId, blockId)
    }

    @Patch('reorder')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('manage_blogs')
    reorder(@Param('postId') postId: string, @Body() dto: ReorderBlogBlocksDto) {
        return this.blocksService.reorder(postId, dto.order)
    }
}
