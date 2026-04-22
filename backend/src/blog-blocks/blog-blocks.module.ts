import { Module } from '@nestjs/common'
import { BlogBlocksController } from './blog-blocks.controller'
import { BlogBlocksService } from './blog-blocks.service'

@Module({
    controllers: [BlogBlocksController],
    providers: [BlogBlocksService],
    exports: [BlogBlocksService],
})
export class BlogBlocksModule {}
