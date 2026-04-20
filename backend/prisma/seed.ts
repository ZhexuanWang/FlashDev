import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaults: { key: string; value: string }[] = [
    { key: 'theme.primary',       value: '0ea5e9'        },
    { key: 'theme.glow',          value: '38bdf8'         },
    { key: 'default.menu',        value: 'starfield'      },
    { key: 'intro.video.url',     value: ''               },
    { key: 'contact.email',       value: 'contact@flashdev.com' },
    { key: 'rtl.enabled',         value: 'false'          },
    { key: 'splash.skip.allowed', value: 'false'         },
];

async function main() {
    for (const item of defaults) {
        await prisma.siteConfig.upsert({
            where: { key: item.key },
            update: {},
            create: { key: item.key, value: item.value },
        });
    }
    console.log('✅ SiteConfig seeded');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());