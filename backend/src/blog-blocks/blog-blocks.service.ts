import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateBlogBlockDto, UpdateBlogBlockDto } from './dto/create-blog-block.dto'
import type { Prisma } from '@prisma/client'

@Injectable()
export class BlogBlocksService {
    constructor(private prisma: PrismaService) {}

    async findAllByPost(postId: string) {
        await this.checkPostExists(postId)
        return this.prisma.blogBlock.findMany({
            where: { postId },
            orderBy: { order: 'asc' },
        })
    }

    async create(postId: string, dto: CreateBlogBlockDto) {
        await this.checkPostExists(postId)
        return this.prisma.blogBlock.create({
            data: {
                postId,
                type: dto.type,
                content: (dto.content ?? {}) as Prisma.InputJsonValue,
                order: dto.order ?? 0,
            },
        })
    }

    async update(postId: string, blockId: string, dto: UpdateBlogBlockDto) {
        await this.checkPostExists(postId)
        const block = await this.prisma.blogBlock.findUnique({ where: { id: blockId } })
        if (!block || block.postId !== postId) {
            throw new NotFoundException('Block not found')
        }
        return this.prisma.blogBlock.update({
            where: { id: blockId },
            data: {
                ...(dto.type !== undefined && { type: dto.type }),
                ...(dto.content !== undefined && { content: dto.content }),
                ...(dto.order !== undefined && { order: dto.order }),
            },
        })
    }

    async remove(postId: string, blockId: string) {
        await this.checkPostExists(postId)
        const block = await this.prisma.blogBlock.findUnique({ where: { id: blockId } })
        if (!block || block.postId !== postId) {
            throw new NotFoundException('Block not found')
        }
        return this.prisma.blogBlock.delete({ where: { id: blockId } })
    }

    async reorder(postId: string, order: string[]) {
        await this.checkPostExists(postId)
        const updates = order.map((blockId, index) =>
            this.prisma.blogBlock.updateMany({
                where: { id: blockId, postId },
                data: { order: index },
            }),
        )
        await this.prisma.$transaction(updates)
        return this.findAllByPost(postId)
    }

    private async checkPostExists(postId: string) {
        const post = await this.prisma.blogPost.findUnique({ where: { id: postId } })
        if (!post) throw new NotFoundException('Blog post not found')
    }
}
