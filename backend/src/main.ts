import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { join } from 'path'

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule)

    // 必须有这一行，才能正确解析 DTO
    app.useGlobalPipes(new ValidationPipe({
        // whitelist removed: explicit DTOs use class-validator decorators;
        // Record<string,unknown> body endpoints (team, projects, blog create)
        // need all fields passed through, not stripped.
        transform: true,
    }))

    app.enableCors({ origin: 'http://localhost:5173' })

    app.useStaticAssets(join(process.cwd(), '..', 'uploads'), {
        prefix: '/uploads',
    })

    await app.listen(3000)
}
bootstrap()