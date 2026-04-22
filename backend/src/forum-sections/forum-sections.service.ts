import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ForumSectionsService {
    constructor(private prisma: PrismaService) {}

    findAll() {
        return this.prisma.forumSection.findMany({
            include: {
                groups: {
                    include: { _count: { select: { posts: true } } },
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { order: 'asc' },
        })
    }

    create(data: { nameZh: string; nameEn: string; descriptionZh?: string; descriptionEn?: string; icon?: string }) {
        return this.prisma.forumSection.create({
            data: {
                name:        { zh: data.nameZh, en: data.nameEn },
                description: data.descriptionZh ? { zh: data.descriptionZh, en: data.descriptionEn ?? '' } : null,
                icon:        data.icon ?? '📂',
            },
        })
    }

    async update(id: string, data: Record<string, unknown>) {
        const section = await this.prisma.forumSection.findUnique({ where: { id } })
        if (!section) throw new NotFoundException('Section not found')
        const existingName = section.name as { zh: string; en: string }
        return this.prisma.forumSection.update({
            where: { id },
            data: {
                ...(data['nameZh'] !== undefined ? { name: { zh: String(data['nameZh']), en: existingName.en } } : {}),
                ...(data['nameEn'] !== undefined ? { name: { zh: existingName.zh, en: String(data['nameEn']) } } : {}),
                ...(data['icon'] !== undefined ? { icon: String(data['icon']) } : {}),
                ...(data['order'] !== undefined ? { order: Number(data['order']) } : {}),
            },
        })
    }

    async remove(id: string) {
        await this.prisma.forumSection.findUnique({ where: { id } })
        return this.prisma.forumSection.delete({ where: { id } })
    }
}