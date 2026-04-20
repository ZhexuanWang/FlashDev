import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ProjectType } from '@prisma/client'
import type { CreateProjectDto } from './dto/create-project.dto'
import type { UpdateProjectDto } from './dto/update-project.dto'

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

    async update(id: string, dto: UpdateProjectDto) {
        const current = await this.findOne(id)

        const title = (dto.titleZh !== undefined || dto.titleEn !== undefined)
            ? {
                zh: dto.titleZh ?? (current.title as { zh: string; en: string }).zh,
                en: dto.titleEn ?? (current.title as { zh: string; en: string }).en,
            }
            : undefined

        const description = (dto.descriptionZh !== undefined || dto.descriptionEn !== undefined)
            ? {
                zh: dto.descriptionZh ?? (current.description as { zh: string; en: string }).zh,
                en: dto.descriptionEn ?? (current.description as { zh: string; en: string }).en,
            }
            : undefined

        return this.prisma.project.update({
            where: { id },
            data: {
                ...(title       && { title }),
                ...(description && { description }),
                ...(dto.type       !== undefined && { type: dto.type }),
                ...(dto.categoryId !== undefined && {
                    category: dto.categoryId
                        ? { connect: { id: dto.categoryId } }
                        : { disconnect: true },
                }),
                ...(dto.media       !== undefined && { media: dto.media }),
                ...(dto.price       !== undefined && { price: dto.price }),
                ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
            },
        })
    }

    async remove(id: string) {
        await this.findOne(id)
        return this.prisma.project.delete({ where: { id } })
    }
}