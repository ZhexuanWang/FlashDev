import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { MarketStatus } from '@prisma/client'

@Injectable()
export class MarketService {
    constructor(private prisma: PrismaService) {}

    async findAll(options?: {
        page?: number; limit?: number
        status?: MarketStatus; tag?: string; search?: string
    }) {
        const page = options?.page ?? 1
        const limit = options?.limit ?? 20
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}
        if (options?.status) where.status = options.status
        if (options?.tag) where.tags = { has: options.tag }
        if (options?.search) {
            where.OR = [
                { title: { contains: options.search, mode: 'insensitive' } },
                { description: { contains: options.search, mode: 'insensitive' } },
            ]
        }

        const [posts, total] = await Promise.all([
            this.prisma.marketPost.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: { poster: { select: { id: true, email: true } } },
            }),
            this.prisma.marketPost.count({ where }),
        ])

        return { posts, total, page, limit, totalPages: Math.ceil(total / limit) }
    }

    async findOne(id: string) {
        const post = await this.prisma.marketPost.findUnique({
            where: { id },
            include: { poster: { select: { id: true, email: true } } },
        })
        if (!post) throw new NotFoundException('Market post not found')
        return post
    }

    async create(data: {
        title: string; description: string; budget?: number; timeline?: string
        contactEmail?: string; tags?: string[]; posterId?: string
    }) {
        return this.prisma.marketPost.create({
            data: {
                title:        data.title,
                description:  data.description,
                budget:       data.budget,
                timeline:     data.timeline,
                contactEmail: data.contactEmail,
                tags:         data.tags ?? [],
                posterId:     data.posterId,
                status:       MarketStatus.OPEN,
            },
        })
    }

    async updateStatus(id: string, status: MarketStatus, posterId?: string) {
        const post = await this.findOne(id)
        // Only poster can update their own post
        if (posterId && post.posterId !== posterId) {
            throw new NotFoundException('Not authorized')
        }
        return this.prisma.marketPost.update({
            where: { id },
            data: { status },
        })
    }
}
