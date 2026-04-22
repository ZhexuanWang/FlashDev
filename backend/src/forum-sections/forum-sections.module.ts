import { Module } from '@nestjs/common'
import { ForumSectionsController } from './forum-sections.controller'
import { ForumSectionsService } from './forum-sections.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
    imports: [PrismaModule],
    controllers: [ForumSectionsController],
    providers: [ForumSectionsService],
})
export class ForumSectionsModule {}