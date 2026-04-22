import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ForumService {
    constructor(private prisma: PrismaService) {}

    async findAllPosts(options?: { page?: number; limit?: number; tag?: string; groupId?: string }) {
        const page = options?.page ?? 1
        const limit = options?.limit ?? 20
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}
        if (options?.tag) where.tags = { has: options.tag }
        if (options?.groupId) where.groupId = options.groupId

        const [posts, total] = await Promise.all([
            this.prisma.forumPost.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    author: { select: { id: true, email: true } },
                    group: { select: { id: true, name: true } },
                    _count: { select: { comments: true } },
                },
            }),
            this.prisma.forumPost.count({ where }),
        ])

        return { posts, total, page, limit, totalPages: Math.ceil(total / limit) }
    }

    async findOnePost(id: string) {
        const post = await this.prisma.forumPost.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, email: true } },
                group: { include: { section: { select: { id: true, name: true } } } },
                comments: {
                    orderBy: { createdAt: 'asc' },
                    include: { author: { select: { id: true, email: true } } },
                },
            },
        })
        if (!post) throw new NotFoundException('Forum post not found')
        return post
    }

    async createPost(data: {
        title: string; content: unknown; tags?: string[]
        authorId?: string
    }) {
        return this.prisma.forumPost.create({
            data: {
                title:    data.title,
                content:  data.content as object,
                tags:     data.tags ?? [],
                authorId: data.authorId,
            },
        })
    }

    async upvote(postId: string) {
        const post = await this.prisma.forumPost.findUnique({ where: { id: postId } })
        if (!post) throw new NotFoundException('Post not found')
        return this.prisma.forumPost.update({
            where: { id: postId },
            data: { upvotes: post.upvotes + 1 },
        })
    }

    async createComment(data: {
        postId: string; content: string; authorId?: string
    }) {
        await this.findOnePost(data.postId)
        return this.prisma.forumComment.create({
            data: {
                postId:   data.postId,
                content:  data.content,
                authorId: data.authorId,
            },
        })
    }
}
