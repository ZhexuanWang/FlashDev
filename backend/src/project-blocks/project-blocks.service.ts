import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateBlockDto, UpdateBlockDto } from './dto/create-block.dto'
import type { Prisma } from '@prisma/client'

@Injectable()
export class ProjectBlocksService {
    constructor(private prisma: PrismaService) {}

    async findAllByProject(projectId: string) {
        await this.checkProjectExists(projectId)
        return this.prisma.projectBlock.findMany({
            where: { projectId },
            orderBy: { order: 'asc' },
        })
    }

    async create(projectId: string, dto: CreateBlockDto) {
        await this.checkProjectExists(projectId)
        return this.prisma.projectBlock.create({
            data: {
                projectId,
                type: dto.type,
                content: (dto.content ?? {}) as Prisma.InputJsonValue,
                order: dto.order ?? 0,
            },
        })
    }

    async update(projectId: string, blockId: string, dto: UpdateBlockDto) {
        await this.checkProjectExists(projectId)
        const block = await this.prisma.projectBlock.findUnique({ where: { id: blockId } })
        if (!block || block.projectId !== projectId) {
            throw new NotFoundException('Block not found')
        }
        return this.prisma.projectBlock.update({
            where: { id: blockId },
            data: {
                ...(dto.type !== undefined && { type: dto.type }),
                ...(dto.content !== undefined && { content: dto.content }),
                ...(dto.order !== undefined && { order: dto.order }),
            },
        })
    }

    async remove(projectId: string, blockId: string) {
        await this.checkProjectExists(projectId)
        const block = await this.prisma.projectBlock.findUnique({ where: { id: blockId } })
        if (!block || block.projectId !== projectId) {
            throw new NotFoundException('Block not found')
        }
        return this.prisma.projectBlock.delete({ where: { id: blockId } })
    }

    async reorder(projectId: string, order: string[]) {
        await this.checkProjectExists(projectId)
        const updates = order.map((blockId, index) =>
            this.prisma.projectBlock.updateMany({
                where: { id: blockId, projectId },
                data: { order: index },
            }),
        )
        await this.prisma.$transaction(updates)
        return this.findAllByProject(projectId)
    }

    private async checkProjectExists(projectId: string) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } })
        if (!project) throw new NotFoundException('Project not found')
    }
}
