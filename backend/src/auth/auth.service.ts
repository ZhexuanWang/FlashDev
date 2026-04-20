import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from '../users/users.service'
import type { RegisterDto } from './dto/register.dto'
import type { LoginDto }    from './dto/login.dto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService:   JwtService,
    ) {}

    async register(dto: RegisterDto) {
        const existing = await this.usersService.findByEmail(dto.email)
        if (existing) throw new ConflictException('Email already in use')

        const hashed = await bcrypt.hash(dto.password, 10)
        const user   = await this.usersService.create(dto.email, hashed)

        return this.signToken(user.id, user.email, user.role, user.permissions as Record<string, boolean>)
    }

    async login(dto: LoginDto) {
        const user = await this.usersService.findByEmail(dto.email)
        if (!user) throw new UnauthorizedException('邮箱或密码错误')
        if (!user.isActive) throw new UnauthorizedException('账号已被禁用')

        const valid = await bcrypt.compare(dto.password, user.password)
        if (!valid) throw new UnauthorizedException('邮箱或密码错误')

        return this.signToken(user.id, user.email, user.role, user.permissions as Record<string, boolean>)
    }

    private signToken(
        userId:      string,
        email:       string,
        role:        string,
        permissions: Record<string, boolean> = {},  // ← 新增
    ) {
        const payload = { sub: userId, email, role }
        return {
            access_token: this.jwtService.sign(payload),
            role,
            userId,                                     // ← 新增
            permissions: permissions ?? {},             // ← 新增
        }
    }
}