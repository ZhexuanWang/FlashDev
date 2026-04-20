// src/components/RequireRole.tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface Props {
    role: 'COMPANY' | 'ADMIN' | 'USER'
    children: React.ReactNode
    redirectTo?: string
}

export default function RequireRole({ role, children, redirectTo = '/home' }: Props) {
    const { role: currentRole } = useAuthStore()

    if (currentRole !== role) {
        return <Navigate to={redirectTo} replace />
    }

    return <>{children}</>
}