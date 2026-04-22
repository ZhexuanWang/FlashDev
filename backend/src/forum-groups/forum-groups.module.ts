import { Module } from '@nestjs/common'
import { ForumGroupsController } from './forum-groups.controller'
import { ForumGroupsService } from './forum-groups.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
    imports: [PrismaModule],
    controllers: [ForumGroupsController],
    providers: [ForumGroupsService],
})
export class ForumGroupsModule {}