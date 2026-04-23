import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateBlogPostDto } from './dto/create-blog-post.dto'

@Injectable()
export class BlogPostsService {
    constructor(private prisma: PrismaService) {}

    async findAll(options?: { page?: number; limit?: number; tag?: string }) {
        const page = options?.page ?? 1
        const limit = options?.limit ?? 10
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {
            isPublished: true,
        }
        if (options?.tag) {
            where.tags = { has: options.tag }
        }

        const [posts, total] = await Promise.all([
            this.prisma.blogPost.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.blogPost.count({ where }),
        ])

        return { posts, total, page, limit, totalPages: Math.ceil(total / limit) }
    }

    async findAllAdmin(options?: { page?: number; limit?: number; tag?: string }) {
        const page = options?.page ?? 1
        const limit = options?.limit ?? 20
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}
        if (options?.tag) where.tags = { has: options.tag }

        const [posts, total] = await Promise.all([
            this.prisma.blogPost.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: { author: { select: { id: true, email: true } } },
            }),
            this.prisma.blogPost.count({ where }),
        ])

        return { posts, total, page, limit, totalPages: Math.ceil(total / limit) }
    }

    async findOne(id: string) {
        const post = await this.prisma.blogPost.findUnique({
            where: { id },
            include: { author: { select: { id: true, email: true } } },
        })
        if (!post) throw new NotFoundException('Blog post not found')
        return post
    }

    async create(dto: CreateBlogPostDto, authorId?: string) {
        return this.prisma.blogPost.create({
            data: {
                title:       { zh: dto.titleZh,       en: dto.titleEn },
                excerpt:     { zh: dto.excerptZh,     en: dto.excerptEn },
                coverImage:  dto.coverImage,
                tags:        dto.tags ?? [],
                authorId:    authorId,
                isPublished: dto.isPublished ?? false,
            },
        })
    }

    async update(id: string, raw: Record<string, unknown>) {
        const title = (raw.titleZh !== undefined || raw.titleEn !== undefined)
            ? {
                zh: (raw.titleZh as string | undefined) ?? '',
                en: (raw.titleEn as string | undefined) ?? '',
            }
            : undefined

        const excerpt = (raw.excerptZh !== undefined || raw.excerptEn !== undefined)
            ? {
                zh: (raw.excerptZh as string | undefined) ?? '',
                en: (raw.excerptEn as string | undefined) ?? '',
            }
            : undefined

        return this.prisma.blogPost.update({
            where: { id },
            data: {
                ...(title    && { title }),
                ...(excerpt  && { excerpt }),
                ...(raw.coverImage !== undefined && { coverImage: raw.coverImage as string | null }),
                ...(raw.tags !== undefined && { tags: raw.tags as string[] }),
                ...(raw.isPublished !== undefined && { isPublished: raw.isPublished as boolean }),
            },
        })
    }

    async remove(id: string) {
        await this.findOne(id)
        return this.prisma.blogPost.delete({ where: { id } })
    }
}
