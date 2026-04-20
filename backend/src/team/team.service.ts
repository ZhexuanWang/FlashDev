import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateTeamMemberDto } from './dto/create-team-member.dto'
import type { UpdateTeamMemberDto } from './dto/update-team-member.dto'

@Injectable()
export class TeamService {
    constructor(private prisma: PrismaService) {}

    findAll() {
        return this.prisma.teamMember.findMany({
            where:   { isVisible: true },
            orderBy: { order: 'asc' },
        })
    }

    findAllAdmin() {
        return this.prisma.teamMember.findMany({ orderBy: { order: 'asc' } })
    }

    async findOne(id: string) {
        const member = await this.prisma.teamMember.findUnique({ where: { id } })
        if (!member) throw new NotFoundException('Team member not found')
        return member
    }

    create(dto: CreateTeamMemberDto) {
        return this.prisma.teamMember.create({
            data: {
                name:      { zh: dto.nameZh, en: dto.nameEn },
                role:      { zh: dto.roleZh, en: dto.roleEn },
                bio:       { zh: dto.bioZh,  en: dto.bioEn  },
                avatar:    dto.avatar    ?? '',
                github:    dto.github    ?? '',
                order:     dto.order     ?? 0,
                isVisible: dto.isVisible ?? true,
            },
        })
    }

    async update(id: string, dto: UpdateTeamMemberDto) {
        const current = await this.findOne(id)

        const existingName = current.name as { zh: string; en: string }
        const existingRole = current.role as { zh: string; en: string }
        const existingBio  = current.bio  as { zh: string; en: string }

        return this.prisma.teamMember.update({
            where: { id },
            data: {
                ...(dto.nameZh !== undefined || dto.nameEn !== undefined
                    ? { name: { zh: dto.nameZh ?? existingName.zh, en: dto.nameEn ?? existingName.en } }
                    : {}),
                ...(dto.roleZh !== undefined || dto.roleEn !== undefined
                    ? { role: { zh: dto.roleZh ?? existingRole.zh, en: dto.roleEn ?? existingRole.en } }
                    : {}),
                ...(dto.bioZh !== undefined || dto.bioEn !== undefined
                    ? { bio: { zh: dto.bioZh ?? existingBio.zh, en: dto.bioEn ?? existingBio.en } }
                    : {}),
                ...(dto.avatar    !== undefined ? { avatar:    dto.avatar    } : {}),
                ...(dto.github    !== undefined ? { github:    dto.github    } : {}),
                ...(dto.order     !== undefined ? { order:     dto.order     } : {}),
                ...(dto.isVisible !== undefined ? { isVisible: dto.isVisible } : {}),
            },
        })
    }

    async remove(id: string) {
        await this.findOne(id)
        return this.prisma.teamMember.delete({ where: { id } })
    }

    // 批量更新排序
    async reorder(items: { id: string; order: number }[]) {
        await Promise.all(
            items.map(({ id, order }) =>
                this.prisma.teamMember.update({ where: { id }, data: { order } })
            )
        )
        return { success: true }
    }
}