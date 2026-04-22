import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    // Auth 需要的方法
    async findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } })
    }

    async create(email: string, hashedPassword: string) {
        return this.prisma.user.create({
            data: {
                email,
                password:    hashedPassword,
                role:        'USER',
                permissions: {},
                isActive:    true,
            },
        })
    }

    // Permissions Panel 需要的方法
    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id:          true,
                email:       true,
                role:        true,
                permissions: true,
                isActive:    true,
            },
            orderBy: { createdAt: 'asc' },
        })
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id:          true,
                email:       true,
                role:        true,
                permissions: true,
                isActive:    true,
            },
        })
        if (!user) throw new NotFoundException('User not found')
        return user
    }

    async updatePermissions(targetId: string, permissions: Record<string, boolean>) {
        const target = await this.prisma.user.findUnique({ where: { id: targetId } })
        if (!target) throw new NotFoundException('User not found')
        if (target.role === 'COMPANY') {
            throw new ForbiddenException('Cannot modify COMPANY permissions')
        }
        return this.prisma.user.update({
            where: { id: targetId },
            data:  { permissions },
            select: { id: true, email: true, role: true, permissions: true },
        })
    }

    async setActive(targetId: string, isActive: boolean) {
        const target = await this.prisma.user.findUnique({ where: { id: targetId } })
        if (!target) throw new NotFoundException('User not found')
        if (target.role === 'COMPANY') {
            throw new ForbiddenException('Cannot deactivate COMPANY account')
        }
        return this.prisma.user.update({
            where: { id: targetId },
            data:  { isActive },
            select: { id: true, email: true, role: true, isActive: true },
        })
    }

    async findMe(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } })
        if (!user) throw new NotFoundException('User not found')
        return {
            id:          user.id,
            email:       user.email,
            role:        user.role,
            phone:       user.phone,
            avatar:      user.avatar,
            bio:         user.bio,
            permissions: user.permissions,
            isActive:    user.isActive,
            createdAt:   user.createdAt,
        }
    }

    async updateProfile(id: string, data: { phone?: string; avatar?: string; bio?: string }) {
        return this.prisma.user.update({
            where: { id },
            data: {
                ...(data.phone  !== undefined && { phone:  data.phone  }),
                ...(data.avatar !== undefined && { avatar: data.avatar }),
                ...(data.bio   !== undefined && { bio:    data.bio   }),
            },
            select: { id: true, email: true, role: true, phone: true, avatar: true, bio: true },
        })
    }
}