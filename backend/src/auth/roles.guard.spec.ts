import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';

function mockContext(user: { role?: string } | null): ExecutionContext {
    return {
        switchToHttp: () => ({
            getRequest: () => ({ user }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
    } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RolesGuard, Reflector],
        }).compile();

        guard    = module.get<RolesGuard>(RolesGuard);
        reflector = module.get<Reflector>(Reflector);
    });

    it('allows request when no roles are required', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
        expect(guard.canActivate(mockContext({ role: 'USER' }))).toBe(true);
    });

    it('allows request when user role matches required roles', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['COMPANY', 'ADMIN']);
        expect(guard.canActivate(mockContext({ role: 'ADMIN' }))).toBe(true);
    });

    it('denies request when user role is not in required roles', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['COMPANY']);
        expect(guard.canActivate(mockContext({ role: 'ADMIN' }))).toBe(false);
    });

    it('denies request when user has no role', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['COMPANY']);
        expect(guard.canActivate(mockContext({ role: undefined }))).toBe(false);
    });

    it('denies request when there is no user object', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['COMPANY']);
        expect(guard.canActivate(mockContext(null))).toBe(false);
    });
});
