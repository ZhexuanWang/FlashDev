import {
    Controller, Get, Post, Patch, Delete,
    Body, Param, UseGuards,
} from '@nestjs/common'
import { ProjectBlocksService } from './project-blocks.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { CreateBlockDto, UpdateBlockDto, ReorderBlocksDto } from './dto/create-block.dto'
import { CreateInquiryDto } from './dto/create-inquiry.dto'
import { MailService } from '../mail/mail.service'
import { PrismaService } from '../prisma/prisma.service'

@Controller('projects/:projectId/blocks')
export class ProjectBlocksController {
    constructor(
        private readonly blocksService: ProjectBlocksService,
        private readonly mailService: MailService,
        private readonly prisma: PrismaService,
    ) {}

    @Get()
    findAll(@Param('projectId') projectId: string) {
        return this.blocksService.findAllByProject(projectId)
    }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('manage_projects')
    create(@Param('projectId') projectId: string, @Body() dto: CreateBlockDto) {
        return this.blocksService.create(projectId, dto)
    }

    @Patch(':blockId')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('manage_projects')
    update(
        @Param('projectId') projectId: string,
        @Param('blockId') blockId: string,
        @Body() dto: UpdateBlockDto,
    ) {
        return this.blocksService.update(projectId, blockId, dto)
    }

    @Delete(':blockId')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('manage_projects')
    remove(@Param('projectId') projectId: string, @Param('blockId') blockId: string) {
        return this.blocksService.remove(projectId, blockId)
    }

    @Patch('reorder')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('manage_projects')
    reorder(@Param('projectId') projectId: string, @Body() dto: ReorderBlocksDto) {
        return this.blocksService.reorder(projectId, dto.order)
    }

    @Post('inquiry')
    @UseGuards(JwtAuthGuard)
    async inquiry(
        @Param('projectId') projectId: string,
        @Body() dto: CreateInquiryDto,
    ) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } })
        if (!project) return { success: false, message: 'Project not found' }

        const title = project.title as { zh: string; en: string }
        const desc = project.description as { zh: string; en: string }

        const text = [
            `Project: ${title.en || title.zh}`,
            `Description: ${desc.en || desc.zh}`,
            '',
            `From: ${dto.name} <${dto.email}>`,
            dto.message ? `\nMessage:\n${dto.message}` : '',
        ].filter(Boolean).join('\n')

        await this.mailService.sendMail({
            to: dto.email,
            subject: `[Project Inquiry] ${title.en || title.zh}`,
            text,
        })

        return { success: true }
    }
}
