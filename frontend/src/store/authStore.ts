import { create } from 'zustand'
import { useEditorStore } from './editorStore'

type Role = 'COMPANY' | 'ADMIN' | 'USER'

interface AuthState {
    token:       string | null
    role:        Role   | null
    userId:      string | null
    permissions: Record<string, boolean>
    login: (payload: {
        token:        string
        role:         Role
        userId:       string
        permissions?: Record<string, boolean>
    }) => void
    logout:    () => void
    isCompany: () => boolean
    isAdmin:   () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
    token:       null,
    role:        null,
    userId:      null,
    permissions: {},

    login({ token, role, userId, permissions = {} }) {
        const finalPermissions = role === 'COMPANY'
            ? { manage_blogs: true, ...permissions }
            : permissions
        set({ token, role, userId, permissions: finalPermissions })
        if (role === 'COMPANY' || role === 'ADMIN') {
            useEditorStore.getState().enterEditMode(token, role)
        }
    },

    logout() {
        set({ token: null, role: null, userId: null, permissions: {} })
        useEditorStore.getState().exitEditMode()
    },

    isCompany: () => get().role === 'COMPANY',
    isAdmin:   () => get().role === 'ADMIN',
}))