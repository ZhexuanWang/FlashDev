import { Module } from '@nestjs/common'
import { ProjectBlocksController } from './project-blocks.controller'
import { ProjectBlocksService } from './project-blocks.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
    imports: [PrismaModule],
    controllers: [ProjectBlocksController],
    providers: [ProjectBlocksService],
    exports: [ProjectBlocksService],
})
export class ProjectBlocksModule {}
