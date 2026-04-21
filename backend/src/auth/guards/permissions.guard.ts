import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '../../prisma/prisma.service'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ])
        if (!required || required.length === 0) return true

        const { user } = context.switchToHttp().getRequest()

        // COMPANY always has all permissions
        if (user?.role === 'COMPANY') return true

        // ADMIN must be active and have each required permission
        if (user?.role === 'ADMIN') {
            const dbUser = await this.prisma.user.findUnique({
                where: { id: user.userId },
                select: { isActive: true, permissions: true },
            })
            if (!dbUser?.isActive) return false

            const perms = (dbUser.permissions ?? {}) as Record<string, boolean>
            const missing = required.filter(p => !perms[p])
            if (missing.length > 0) {
                throw new ForbiddenException(`Missing permission: ${missing[0]}`)
            }
            return true
        }

        return false
    }
}
