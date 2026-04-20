import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ProjectCategoriesService {
    constructor(private prisma: PrismaService) {}

    findAll() {
        return this.prisma.projectCategory.findMany({ orderBy: { order: 'asc' } })
    }

    create(nameZh: string, nameEn: string, icon: string) {
        return this.prisma.projectCategory.create({
            data: { name: { zh: nameZh, en: nameEn }, icon, order: 0 },
        })
    }

    remove(id: string) {
        return this.prisma.projectCategory.delete({ where: { id } })
    }
}