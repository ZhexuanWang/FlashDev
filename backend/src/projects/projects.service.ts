import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ProjectType } from '@prisma/client'

@Injectable()
export class ProjectsService {
    constructor(private prisma: PrismaService) {}

    async findAll(options?: {
        categoryId?: string
        type?: string
        page?: number
        limit?: number
        includeAll?: boolean
    }) {
        const page = options?.page ?? 1
        const limit = options?.limit ?? 9
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {
            ...(options?.includeAll ? {} : { isPublished: true }),
            ...(options?.categoryId && { categoryId: options.categoryId }),
            ...(options?.type && Object.values(ProjectType).includes(options.type as ProjectType)
                ? { type: options.type as ProjectType }
                : {}),
        }

        const [projects, total] = await Promise.all([
            this.prisma.project.findMany({
                where,
                include: { category: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.project.count({ where }),
        ])

        return {
            projects,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    }

    async findAllAdmin(options?: { page?: number; limit?: number }) {
        const page = options?.page ?? 1
        const limit = options?.limit ?? 20
        const skip = (page - 1) * limit

        const [projects, total] = await Promise.all([
            this.prisma.project.findMany({
                include: { category: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.project.count(),
        ])

        return { projects, total, page, limit, totalPages: Math.ceil(total / limit) }
    }

    async findOne(id: string) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: { category: true },
        })
        if (!project) throw new NotFoundException('Project not found')
        return project
    }

    async create(raw: Record<string, unknown>) {
        const type = raw.type as string
        if (type && !Object.values(ProjectType).includes(type as ProjectType)) {
            throw new NotFoundException(`Invalid project type: ${type}`)
        }
        return this.prisma.project.create({
            data: {
                title:       {
                    zh: (raw.titleZh as string) ?? '',
                    en: (raw.titleEn as string) ?? '',
                },
                description: {
                    zh: (raw.descriptionZh as string) ?? '',
                    en: (raw.descriptionEn as string) ?? '',
                },
                type:        (type as ProjectType) ?? ProjectType.SHOWCASE,
                // ↓ 用 connect 语法关联，不直接写 categoryId
                ...((raw.categoryId as string)
                    ? { category: { connect: { id: raw.categoryId as string } } }
                    : {}),
                media:       (raw.media as string[]) ?? [],
                price:       raw.price as number | undefined,
                isPublished: (raw.isPublished as boolean) ?? false,
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