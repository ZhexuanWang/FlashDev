import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { Layout } from '../components/Layout'

interface UserProfile {
    id: string
    email: string
    role: string
    phone?: string | null
    avatar?: string | null
    bio?: string | null
    permissions: Record<string, boolean> | null
    isActive: boolean
    createdAt: string
}

export default function ProfilePage() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const navigate = useNavigate()

    const { token, role, logout } = useAuthStore()

    const [profile,  setProfile]  = useState<UserProfile | null>(null)
    const [loading,  setLoading]  = useState(true)
    const [editing,  setEditing]  = useState(false)
    const [saving,   setSaving]   = useState(false)

    const [phone, setPhone] = useState('')
    const [bio,   setBio]   = useState('')

    useEffect(() => {
        if (!token) { navigate('/login'); return }
        fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then((data: UserProfile) => {
                setProfile(data)
                setPhone(data.phone ?? '')
                setBio(data.bio ?? '')
            })
            .finally(() => setLoading(false))
    }, [token, navigate])

    const handleSave = async () => {
        if (!token) return
        setSaving(true)
        try {
            const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ phone, bio }),
            })
            if (res.ok) {
                const updated = await res.json()
                setProfile(prev => prev ? { ...prev, phone: updated.phone, bio: updated.bio } : prev)
                setEditing(false)
            }
        } finally {
            setSaving(false)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/home')
    }

    const roleBadgeColor = role === 'COMPANY'
        ? 'text-emerald-400 border-emerald-800 bg-emerald-950/30'
        : role === 'ADMIN'
        ? 'text-amber-400 border-amber-800 bg-amber-950/30'
        : 'text-slate-400 border-slate-700 bg-slate-900/30'

    const joinDate = profile
        ? new Date(profile.createdAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
          })
        : ''

    return (
        <Layout backPath="/home">
            <div className="max-w-2xl mx-auto px-6 py-10">

                <div className="mb-8">
                    <h1 className="text-slate-200 font-mono text-base tracking-widest">
                        {t('profile.title')}
                    </h1>
                    <p className="text-slate-600 font-mono text-xs mt-1">
                        {lang === 'zh' ? '管理你的个人信息' : 'Manage your personal information'}
                    </p>
                </div>

                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-12 bg-slate-900/60 border border-slate-800 rounded" />
                        ))}
                    </div>
                ) : profile ? (
                    <div className="space-y-6">

                        {/* Avatar + basic info */}
                        <div className="flex items-center gap-6 p-5 rounded-lg bg-slate-900/40 border border-slate-800">
                            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 font-mono text-lg overflow-hidden">
                                {profile.avatar
                                    ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                                    : profile.email[0].toUpperCase()
                                }
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-slate-200 font-mono text-sm">{profile.email}</h2>
                                    <span className={`px-2 py-0.5 rounded border font-mono text-[10px] ${roleBadgeColor}`}>
                                        {profile.role}
                                    </span>
                                </div>
                                <p className="text-slate-700 font-mono text-xs mt-1">
                                    {lang === 'zh' ? '加入于' : 'Joined'} {joinDate}
                                </p>
                            </div>
                        </div>

                        {/* Account ID */}
                        <div className="space-y-1.5">
                            <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                                ID
                            </label>
                            <div className="px-4 py-3 rounded-lg bg-slate-900/40 border border-slate-800">
                                <span className="text-slate-600 font-mono text-xs font-mono">
                                    {profile.id.slice(0, 8).toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Email (readonly) */}
                        <div className="space-y-1.5">
                            <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                                {lang === 'zh' ? '邮箱' : 'Email'}
                            </label>
                            <div className="px-4 py-3 rounded-lg bg-slate-900/40 border border-slate-800">
                                <span className="text-slate-400 font-mono text-xs">{profile.email}</span>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                            <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                                {lang === 'zh' ? '电话' : 'Phone'}
                            </label>
                            {editing ? (
                                <input value={phone} onChange={e => setPhone(e.target.value)}
                                    placeholder={lang === 'zh' ? '请输入电话号码' : 'Enter phone number'}
                                    className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-sky-700 text-slate-200 font-mono text-xs focus:outline-none transition-all" />
                            ) : (
                                <div className="px-4 py-3 rounded-lg bg-slate-900/40 border border-slate-800">
                                    <span className="text-slate-400 font-mono text-xs">
                                        {profile.phone || (lang === 'zh' ? '未填写' : 'Not provided')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Bio */}
                        <div className="space-y-1.5">
                            <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                                {lang === 'zh' ? '个人简介' : 'Bio'}
                            </label>
                            {editing ? (
                                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
                                    placeholder={lang === 'zh' ? '介绍一下自己...' : 'Tell us about yourself...'}
                                    className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-sky-700 text-slate-200 font-mono text-xs resize-none focus:outline-none transition-all" />
                            ) : (
                                <div className="px-4 py-3 rounded-lg bg-slate-900/40 border border-slate-800">
                                    <span className="text-slate-400 font-mono text-xs leading-relaxed">
                                        {profile.bio || (lang === 'zh' ? '未填写' : 'Not provided')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Permissions display */}
                        {profile.role === 'ADMIN' && profile.permissions && (
                            <div className="space-y-2">
                                <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                                    {lang === 'zh' ? '已授权权限' : 'Granted Permissions'}
                                </label>
                                <div className="px-4 py-3 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1.5">
                                    {Object.entries(profile.permissions)
                                        .filter(([, v]) => v)
                                        .map(([key]) => (
                                            <div key={key} className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                <span className="text-slate-400 font-mono text-xs">
                                                    {key}
                                                </span>
                                            </div>
                                        ))}
                                    {Object.values(profile.permissions).every(v => !v) && (
                                        <p className="text-slate-700 font-mono text-xs">
                                            {lang === 'zh' ? '暂无授权权限' : 'No permissions granted yet'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            {editing ? (
                                <>
                                    <button onClick={() => setEditing(false)}
                                        className="flex-1 py-2 border border-slate-700 text-slate-500 font-mono text-xs rounded hover:border-slate-600 hover:text-slate-300 transition-all">
                                        {lang === 'zh' ? '取消' : 'Cancel'}
                                    </button>
                                    <button onClick={handleSave} disabled={saving}
                                        className="flex-1 py-2 bg-sky-900/40 border border-sky-700 text-sky-400 font-mono text-xs rounded hover:border-sky-500 transition-all disabled:opacity-40">
                                        {saving ? (lang === 'zh' ? '保存中...' : 'Saving...') : (lang === 'zh' ? '保存' : 'Save')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setEditing(true)}
                                        className="flex-1 py-2 bg-sky-900/40 border border-sky-700 text-sky-400 font-mono text-xs rounded hover:border-sky-500 transition-all">
                                        ✎ {lang === 'zh' ? '编辑信息' : 'Edit Profile'}
                                    </button>
                                    <button onClick={handleLogout}
                                        className="flex-1 py-2 border border-red-900 text-red-500 font-mono text-xs rounded hover:border-red-700 hover:text-red-400 transition-all">
                                        ⏻ {lang === 'zh' ? '退出登录' : 'Logout'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </Layout>
    )
}
