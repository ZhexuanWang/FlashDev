import { Module } from '@nestjs/common'
import { ForumColumnsService } from './forum-columns.service'
import { ForumColumnsController } from './forum-columns.controller'

@Module({
    controllers: [ForumColumnsController],
    providers: [ForumColumnsService],
    exports: [ForumColumnsService],
})
export class ForumColumnsModule {}
