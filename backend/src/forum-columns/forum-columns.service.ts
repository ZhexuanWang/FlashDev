import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ForumColumnsService {
    constructor(private prisma: PrismaService) {}

    findAll(sectionId?: string) {
        const where = sectionId ? { sectionId } : {}
        return this.prisma.forumColumn.findMany({
            where,
            include: {
                section: { select: { id: true, name: true } },
                groups: {
                    include: { _count: { select: { posts: true } } },
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { order: 'asc' },
        })
    }

    findBySection(sectionId: string) {
        return this.prisma.forumColumn.findMany({
            where: { sectionId },
            include: {
                groups: {
                    include: { _count: { select: { posts: true } } },
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { order: 'asc' },
        })
    }

    create(data: { sectionId: string; nameZh: string; nameEn: string; descriptionZh?: string; descriptionEn?: string }) {
        return this.prisma.forumColumn.create({
            data: {
                sectionId:   data.sectionId,
                name:        { zh: data.nameZh, en: data.nameEn },
                description: data.descriptionZh ? { zh: data.descriptionZh, en: data.descriptionEn ?? '' } : null,
            },
        })
    }

    async update(id: string, data: Record<string, unknown>) {
        const col = await this.prisma.forumColumn.findUnique({ where: { id } })
        if (!col) throw new NotFoundException('Column not found')
        const existingName = col.name as { zh: string; en: string }
        return this.prisma.forumColumn.update({
            where: { id },
            data: {
                ...(data['nameZh'] !== undefined ? { name: { zh: String(data['nameZh']), en: existingName.en } } : {}),
                ...(data['nameEn'] !== undefined ? { name: { zh: existingName.zh, en: String(data['nameEn']) } } : {}),
                ...(data['sectionId'] !== undefined ? { sectionId: String(data['sectionId']) } : {}),
                ...(data['order'] !== undefined ? { order: Number(data['order']) } : {}),
            },
        })
    }

    async remove(id: string) {
        await this.prisma.forumColumn.findUnique({ where: { id } })
        return this.prisma.forumColumn.delete({ where: { id } })
    }
}
