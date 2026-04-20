// src/hooks/usePermissions.ts
import { useAuthStore } from '../store/authStore'
import {
    type PermissionKey,
    PERMISSION_KEYS,
    DEFAULT_PERMISSIONS,
} from '../types/permissions'

export { type PermissionKey } from '../types/permissions'

export function usePermissions(): Record<PermissionKey, boolean> {
    const { role, permissions } = useAuthStore()

    if (role === 'COMPANY') {
        return Object.fromEntries(
            PERMISSION_KEYS.map((k) => [k, true])
        ) as Record<PermissionKey, boolean>
    }

    if (role === 'ADMIN') {
        return {
            ...DEFAULT_PERMISSIONS,
            ...(permissions as Record<PermissionKey, boolean>),
        }
    }

    return { ...DEFAULT_PERMISSIONS }
}

export function useHasPermission(key: PermissionKey): boolean {
    const perms = usePermissions()
    return perms[key] ?? false
}