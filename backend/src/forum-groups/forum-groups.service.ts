import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ForumGroupsService {
    constructor(private prisma: PrismaService) {}

    findAll(sectionId?: string) {
        const where = sectionId ? { sectionId } : {}
        return this.prisma.forumGroup.findMany({
            where,
            include: { section: { select: { id: true, name: true } } },
            orderBy: { order: 'asc' },
        })
    }

    create(data: { sectionId: string; nameZh: string; nameEn: string; descriptionZh?: string; descriptionEn?: string }) {
        return this.prisma.forumGroup.create({
            data: {
                sectionId: data.sectionId,
                name:      { zh: data.nameZh, en: data.nameEn },
                description: data.descriptionZh ? { zh: data.descriptionZh, en: data.descriptionEn ?? '' } : null,
            },
        })
    }

    async update(id: string, data: Record<string, unknown>) {
        const group = await this.prisma.forumGroup.findUnique({ where: { id } })
        if (!group) throw new NotFoundException('Group not found')
        const existingName = group.name as { zh: string; en: string }
        return this.prisma.forumGroup.update({
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
        await this.prisma.forumGroup.findUnique({ where: { id } })
        return this.prisma.forumGroup.delete({ where: { id } })
    }
}