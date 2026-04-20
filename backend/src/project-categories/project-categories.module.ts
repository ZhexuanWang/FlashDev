import { Module } from '@nestjs/common'
import { ProjectCategoriesService } from './project-categories.service'
import { ProjectCategoriesController } from './project-categories.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
    imports: [PrismaModule],
    controllers: [ProjectCategoriesController],
    providers: [ProjectCategoriesService],
})
export class ProjectCategoriesModule {}