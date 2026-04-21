import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const areas = ['TOP', 'BOTTOM_LEFT', 'BOTTOM_RIGHT'] as const

    for (const area of areas) {
        await prisma.posterSlot.upsert({
            where: { area },
            create: { area, media: [] },
            update: {},
        })
        console.log(`Ensured PosterSlot: ${area}`)
    }

    console.log('Seeding complete.')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
