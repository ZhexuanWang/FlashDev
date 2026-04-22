import { Module } from '@nestjs/common'
import { BlogPostsController } from './blog-posts.controller'
import { BlogPostsService } from './blog-posts.service'

@Module({
    controllers: [BlogPostsController],
    providers: [BlogPostsService],
    exports: [BlogPostsService],
})
export class BlogPostsModule {}
