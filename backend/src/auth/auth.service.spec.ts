import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '@prisma/client';

jest.mock('bcrypt');

const mockUser = {
    id:          'user-1',
    email:       'alice@example.com',
    password:    '$2b$10$hashed',
    role:        'ADMIN' as Role,
    permissions: { manage_projects: true },
    isActive:    true,
    createdAt:   new Date(),
    updatedAt:   new Date(),
};

describe('AuthService', () => {
    let service: AuthService;
    let usersService: jest.Mocked<UsersService>;
    let jwtService:   jest.Mocked<JwtService>;

    beforeEach(async () => {
        jest.clearAllMocks();
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: {
                        findByEmail: jest.fn(),
                        create:      jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mock.jwt.token'),
                    },
                },
            ],
        }).compile();

        service    = module.get<AuthService>(AuthService);
        usersService = module.get(UsersService);
        jwtService   = module.get(JwtService);
    });

    describe('login', () => {
        it('returns token + user info on correct credentials', async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            usersService.findByEmail.mockResolvedValue(mockUser);
            const result = await service.login({ email: 'alice@example.com', password: 'password123' });
            expect(result.access_token).toBe('mock.jwt.token');
            expect(result.role).toBe('ADMIN');
            expect(result.userId).toBe('user-1');
            expect(result.permissions).toEqual({ manage_projects: true });
        });

        it('throws UnauthorizedException when user not found', async () => {
            usersService.findByEmail.mockResolvedValue(null);
            await expect(
                service.login({ email: 'nobody@example.com', password: 'x' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException when account is inactive', async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            usersService.findByEmail.mockResolvedValue({ ...mockUser, isActive: false });
            await expect(
                service.login({ email: 'alice@example.com', password: 'password123' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException on wrong password', async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            usersService.findByEmail.mockResolvedValue({ ...mockUser });
            await expect(
                service.login({ email: 'alice@example.com', password: 'wrong' }),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('register', () => {
        it('creates user and returns token on success', async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
            usersService.findByEmail.mockResolvedValue(null);
            usersService.create.mockResolvedValue(mockUser);
            const result = await service.register({ email: 'alice@example.com', password: 'password123' });
            expect(result.access_token).toBe('mock.jwt.token');
            expect(usersService.create).toHaveBeenCalledWith('alice@example.com', 'hashedpassword');
        });

        it('throws ConflictException when email already exists', async () => {
            usersService.findByEmail.mockResolvedValue(mockUser);
            await expect(
                service.register({ email: 'alice@example.com', password: 'password123' }),
            ).rejects.toThrow(ConflictException);
        });
    });
});
