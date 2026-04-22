import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PosterArea } from '@prisma/client'

export type PosterAreaKey = 'TOP' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT'

@Injectable()
export class PostersService {
    constructor(private readonly prisma: PrismaService) {}

    findAll() {
        return this.prisma.posterSlot.findMany({ orderBy: { area: 'asc' } })
    }

    findByArea(area: PosterAreaKey) {
        return this.prisma.posterSlot.findUnique({ where: { area } })
    }

    updateMedia(area: PosterAreaKey, media: string[], links: string[] = []) {
        return this.prisma.posterSlot.upsert({
            where: { area },
            create: { area: area as PosterArea, media, links },
            update: { media, links },
        })
    }
}
