import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
    user: {
        findUnique:  jest.fn(),
        findMany:    jest.fn(),
        create:      jest.fn(),
        update:      jest.fn(),
    },
};

describe('UsersService', () => {
    let service: UsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        jest.clearAllMocks();
    });

    describe('findByEmail', () => {
        it('returns user when found', async () => {
            const user = { id: '1', email: 'a@b.com', role: 'USER' };
            mockPrisma.user.findUnique.mockResolvedValue(user);
            await expect(service.findByEmail('a@b.com')).resolves.toEqual(user);
        });

        it('returns null when not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            await expect(service.findByEmail('nobody@b.com')).resolves.toBeNull();
        });
    });

    describe('create', () => {
        it('creates user with USER role', async () => {
            const created = { id: '1', email: 'new@b.com', role: 'USER', permissions: {} };
            mockPrisma.user.create.mockResolvedValue(created);
            const result = await service.create('new@b.com', 'hashedpwd');
            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ email: 'new@b.com', role: 'USER' }),
            });
            expect(result).toEqual(created);
        });
    });

    describe('findAll', () => {
        it('returns all users ordered by createdAt', async () => {
            const users = [
                { id: '1', email: 'a@b.com', role: 'COMPANY' },
                { id: '2', email: 'b@b.com', role: 'ADMIN' },
            ];
            mockPrisma.user.findMany.mockResolvedValue(users);
            await expect(service.findAll()).resolves.toEqual(users);
            expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ orderBy: { createdAt: 'asc' } }),
            );
        });
    });

    describe('updatePermissions', () => {
        it('updates permissions for non-COMPANY user', async () => {
            const target = { id: '2', email: 'b@b.com', role: 'ADMIN' };
            const updated = { ...target, permissions: { manage_projects: true } };
            mockPrisma.user.findUnique.mockResolvedValue(target);
            mockPrisma.user.update.mockResolvedValue(updated);

            const result = await service.updatePermissions('2', { manage_projects: true });
            expect(result.permissions).toEqual({ manage_projects: true });
        });

        it('throws ForbiddenException for COMPANY role', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'c@b.com', role: 'COMPANY' });
            await expect(
                service.updatePermissions('1', { manage_projects: true }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('throws NotFoundException when user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            await expect(
                service.updatePermissions('99', { manage_projects: true }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('setActive', () => {
        it('deactivates non-COMPANY user', async () => {
            const target = { id: '2', email: 'b@b.com', role: 'ADMIN' };
            mockPrisma.user.findUnique.mockResolvedValue(target);
            mockPrisma.user.update.mockResolvedValue({ ...target, isActive: false });

            const result = await service.setActive('2', false);
            expect(result.isActive).toBe(false);
        });

        it('throws ForbiddenException for COMPANY role', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'c@b.com', role: 'COMPANY' });
            await expect(service.setActive('1', false)).rejects.toThrow(ForbiddenException);
        });

        it('throws NotFoundException when user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            await expect(service.setActive('99', false)).rejects.toThrow(NotFoundException);
        });
    });
});
