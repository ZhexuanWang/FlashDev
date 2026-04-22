import {
    Controller, Get, Post, Param, Body, Query, UseGuards,
} from '@nestjs/common'
import { ForumService } from './forum.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('forum/posts')
export class ForumController {
    constructor(private readonly forumService: ForumService) {}

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('tag') tag?: string,
        @Query('groupId') groupId?: string,
    ) {
        return this.forumService.findAllPosts({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            tag,
            groupId,
        })
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.forumService.findOnePost(id)
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    createPost(@Body() body: { title: string; content: unknown; tags?: string[] }) {
        return this.forumService.createPost(body)
    }

    @Post(':id/upvote')
    @UseGuards(JwtAuthGuard)
    upvote(@Param('id') id: string) {
        return this.forumService.upvote(id)
    }

    @Post(':id/comments')
    @UseGuards(JwtAuthGuard)
    createComment(
        @Param('id') postId: string,
        @Body() body: { content: string },
    ) {
        return this.forumService.createComment({ postId, content: body.content })
    }
}
