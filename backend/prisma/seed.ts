import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function hash(password: string) {
    return bcrypt.hash(password, 10)
}

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

    // Ensure admin and company users
    const users = [
        { email: 'admin@flashdev.local', password: 'Admin@123456', role: 'ADMIN' as const },
        { email: 'company@flashdev.local', password: 'Company@123456', role: 'COMPANY' as const },
    ]

    for (const u of users) {
        await prisma.user.upsert({
            where: { email: u.email },
            create: {
                email: u.email,
                password: await hash(u.password),
                role: u.role,
            },
            update: {},
        })
        console.log(`Ensured user: ${u.email} (${u.role})`)
    }

    console.log('Seeding complete.')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
