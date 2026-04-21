import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ProjectType } from '@prisma/client'
import type { CreateProjectDto } from './dto/create-project.dto'

@Injectable()
export class ProjectsService {
    constructor(private prisma: PrismaService) {}

    async findAll(categoryId?: string, type?: string) {
        return this.prisma.project.findMany({
            where: {
                isPublished: true,
                ...(categoryId && { categoryId }),
                // ↓ cast string → ProjectType enum
                ...(type && Object.values(ProjectType).includes(type as ProjectType)
                    ? { type: type as ProjectType }
                    : {}),
            },
            include: { category: true },
            orderBy: { createdAt: 'desc' },
        })
    }

    async findAllAdmin() {
        return this.prisma.project.findMany({
            include: { category: true },
            orderBy: { createdAt: 'desc' },
        })
    }

    async findOne(id: string) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: { category: true },
        })
        if (!project) throw new NotFoundException('Project not found')
        return project
    }

    async create(dto: CreateProjectDto) {
        return this.prisma.project.create({
            data: {
                title:       { zh: dto.titleZh,       en: dto.titleEn },
                description: { zh: dto.descriptionZh, en: dto.descriptionEn },
                type:        dto.type,
                // ↓ 用 connect 语法关联，不直接写 categoryId
                ...(dto.categoryId
                    ? { category: { connect: { id: dto.categoryId } } }
                    : {}),
                media:       dto.media ?? [],
                price:       dto.price,
                isPublished: dto.isPublished ?? false,
            },
        })
    }

    async update(id: string, raw: Record<string, unknown>) {
        const current = await this.findOne(id)

        const title = (raw.titleZh !== undefined || raw.titleEn !== undefined)
            ? {
                zh: (raw.titleZh as string | undefined) ?? (current.title as { zh: string; en: string }).zh,
                en: (raw.titleEn as string | undefined) ?? (current.title as { zh: string; en: string }).en,
            }
            : undefined

        const description = (raw.descriptionZh !== undefined || raw.descriptionEn !== undefined)
            ? {
                zh: (raw.descriptionZh as string | undefined) ?? (current.description as { zh: string; en: string }).zh,
                en: (raw.descriptionEn as string | undefined) ?? (current.description as { zh: string; en: string }).en,
            }
            : undefined

        return this.prisma.project.update({
            where: { id },
            data: {
                ...(title       && { title }),
                ...(description && { description }),
                ...(raw.type       !== undefined && { type: raw.type }),
                ...(raw.categoryId !== undefined && {
                    category: (raw.categoryId as string)
                        ? { connect: { id: raw.categoryId as string } }
                        : { disconnect: true },
                }),
                ...(raw.media       !== undefined && { media: raw.media }),
                ...(raw.price       !== undefined && { price: raw.price }),
                ...(raw.isPublished !== undefined && { isPublished: raw.isPublished }),
            },
        })
    }

    async remove(id: string) {
        await this.findOne(id)
        return this.prisma.project.delete({ where: { id } })
    }
}