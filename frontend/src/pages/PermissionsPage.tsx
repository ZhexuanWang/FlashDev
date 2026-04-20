import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { useEditorStore } from '../store/editorStore'
import { PERMISSION_KEYS, PERMISSION_LABELS } from '../types/permissions'
import type { PermissionKey } from '../types/permissions'
import { Layout } from '../components/Layout'

interface UserRow {
    id:          string
    email:       string
    role:        string
    isActive:    boolean
    permissions: Record<string, boolean> | null
}

export default function PermissionsPage() {
    const navigate      = useNavigate()
    const { role }      = useAuthStore()
    const { token }     = useEditorStore()
    const { i18n }      = useTranslation()
    const lang          = i18n.language === 'zh' ? 'zh' : 'en'

    const [users,   setUsers]   = useState<UserRow[]>([])
    const [loading, setLoading] = useState(true)
    const [saving,  setSaving]  = useState<string | null>(null)  // userId being saved

    // 只有 COMPANY 可以访问
    useEffect(() => {
        if (role !== 'COMPANY') {
            navigate('/home')
            return
        }
        fetch('/api/users', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                // 确保是数组才 setUsers
                if (Array.isArray(data)) {
                    setUsers(data)
                } else {
                    setUsers([])
                }
            })
            .finally(() => setLoading(false))
    }, [role, token, navigate])

    const togglePermission = async (userId: string, key: PermissionKey, current: boolean) => {
        const user = users.find(u => u.id === userId)
        if (!user) return

        const updated = {
            ...(user.permissions ?? {}),
            [key]: !current,
        }

        // 乐观更新
        setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, permissions: updated } : u
        ))

        setSaving(userId)
        try {
            await fetch(`/api/users/${userId}/permissions`, {
                method:  'PATCH',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ permissions: updated }),
            })
        } catch {
            // 失败时回滚
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, permissions: user.permissions } : u
            ))
        } finally {
            setSaving(null)
        }
    }

    const toggleActive = async (userId: string, current: boolean) => {
        setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, isActive: !current } : u
        ))
        setSaving(userId)
        try {
            await fetch(`/api/users/${userId}/active`, {
                method:  'PATCH',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !current }),
            })
        } catch {
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, isActive: current } : u
            ))
        } finally {
            setSaving(null)
        }
    }

    const admins = users.filter(u => u.role === 'ADMIN')

    return (
        <Layout backPath="/home">
            <div className="max-w-4xl mx-auto px-6 py-10">

                <div className="mb-8">
                    <h2 className="text-slate-200 font-mono text-base tracking-widest mb-1">
                        PERMISSIONS PANEL
                    </h2>
                    <p className="text-slate-600 text-xs font-mono">
                        管理 Admin 账号的功能权限
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-5 h-5 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                    </div>
                ) : admins.length === 0 ? (
                    <div className="flex flex-col items-center py-20 gap-3">
                        <div className="text-slate-700 text-4xl">◈</div>
                        <p className="text-slate-600 font-mono text-sm">暂无 Admin 账号</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {admins.map(user => {
                            const perms = user.permissions ?? {}
                            const isSaving = saving === user.id

                            return (
                                <div
                                    key={user.id}
                                    className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden"
                                >
                                    {/* User header */}
                                    <div className="flex items-center justify-between px-5 py-3
                                  border-b border-slate-800/60 bg-slate-900/60">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${
                                                user.isActive ? 'bg-emerald-400' : 'bg-slate-600'
                                            }`} />
                                            <span className="text-slate-300 font-mono text-sm">
                        {user.email}
                      </span>
                                            <span className="text-slate-600 font-mono text-[10px] border border-slate-700
                                       rounded px-1.5 py-0.5">
                        ADMIN
                      </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {isSaving && (
                                                <span className="text-sky-500 font-mono text-[10px] animate-pulse">
                          保存中...
                        </span>
                                            )}
                                            {/* 启用/禁用账号 */}
                                            <button
                                                onClick={() => toggleActive(user.id, user.isActive)}
                                                className={`px-3 py-1 font-mono text-[10px] rounded border transition-all
                          ${user.isActive
                                                    ? 'border-slate-700 text-slate-500 hover:border-red-900 hover:text-red-500'
                                                    : 'border-emerald-900 text-emerald-600 hover:border-emerald-700 hover:text-emerald-400'
                                                }`}
                                            >
                                                {user.isActive ? '禁用账号' : '启用账号'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Permission toggles */}
                                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {PERMISSION_KEYS.map(key => {
                                            const enabled = !!perms[key]
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => togglePermission(user.id, key, enabled)}
                                                    className={`flex items-center justify-between px-4 py-3 rounded border
                                      transition-all duration-200 text-left
                            ${enabled
                                                        ? 'border-sky-800/60 bg-sky-950/30 hover:border-sky-700'
                                                        : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'
                                                    }`}
                                                >
                          <span className={`font-mono text-xs ${
                              enabled ? 'text-sky-300' : 'text-slate-500'
                          }`}>
                            {PERMISSION_LABELS[key][lang]}
                          </span>

                                                    {/* Toggle indicator */}
                                                    <div className={`w-8 h-4 rounded-full relative transition-all duration-300 ${
                                                        enabled ? 'bg-sky-600' : 'bg-slate-700'
                                                    }`}>
                                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white
                                            transition-all duration-300 ${
                                                            enabled ? 'left-4' : 'left-0.5'
                                                        }`} />
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </Layout>
    )
}