import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_KEYS = [
    'theme.primary',
    'theme.glow',
    'default.menu',
    'intro.video.url',
    'contact.email',
    'rtl.enabled',
];

// splash_skip_allowed 不在允许修改列表里，永远是 false

@Injectable()
export class SiteConfigService {
    constructor(private prisma: PrismaService) {}

    async getAll(): Promise<Record<string, string>> {
        const configs = await this.prisma.siteConfig.findMany();
        return configs.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {});
    }

    async getOne(key: string): Promise<string> {
        const config = await this.prisma.siteConfig.findUnique({ where: { key } });
        if (!config) throw new NotFoundException(`Config key "${key}" not found`);
        return config.value;
    }

    async update(key: string, value: string): Promise<{ key: string; value: string }> {
        if (!ALLOWED_KEYS.includes(key)) {
            throw new NotFoundException(`Config key "${key}" is not modifiable`);
        }
        return this.prisma.siteConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }

    async bulkUpdate(updates: Record<string, string>) {
        const results = await Promise.all(
            Object.entries(updates)
                .filter(([key]) => ALLOWED_KEYS.includes(key))
                .map(([key, value]) =>
                    this.prisma.siteConfig.upsert({
                        where: { key },
                        update: { value },
                        create: { key, value },
                    }),
                ),
        );
        return results;
    }
}