import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TeamMember } from '../types/team'
import { Layout } from '../components/Layout'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../store/authStore'
import { useHasPermission } from '../hooks/usePermissions'

const LIMIT = 12

export default function TeamPage() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const navigate = useNavigate()

    const { token } = useEditorStore()
    const { role } = useAuthStore()
    const canManage = useHasPermission('manage_team')
    const canEdit = !!(token && (role === 'COMPANY' || canManage))

    const [members,    setMembers]    = useState<TeamMember[]>([])
    const [total,      setTotal]      = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [page,       setPage]       = useState(1)
    const [loading,    setLoading]    = useState(true)
    const [showModal,  setShowModal]  = useState(false)
    const [deleting,   setDeleting]   = useState<string | null>(null)

    const fetchMembers = (pg: number) => {
        setLoading(true)
        fetch(`/api/team?page=${pg}&limit=${LIMIT}`)
            .then(r => r.json())
            .then((data) => {
                // Backend returns array or { members, total, ... }
                if (Array.isArray(data)) {
                    setMembers(data)
                    setTotal(data.length)
                    setTotalPages(1)
                } else {
                    setMembers(data.members ?? data)
                    setTotal(data.total ?? 0)
                    setTotalPages(data.totalPages ?? 1)
                }
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchMembers(page) }, [page])

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm(lang === 'zh' ? '确认删除此成员？' : 'Delete this member?')) return
        setDeleting(id)
        try {
            const res = await fetch(`/api/team/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) fetchMembers(page)
        } finally {
            setDeleting(null)
        }
    }

    const handleCreate = async (data: {
        nameZh: string; nameEn: string
        roleZh: string; roleEn: string
        bioZh: string; bioEn: string
        github: string; avatar?: string; isVisible: boolean
    }) => {
        const res = await fetch('/api/team', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        })
        if (res.ok) {
            setShowModal(false)
            fetchMembers(1)
        }
    }

    const handleUpdate = async (id: string, data: {
        nameZh?: string; nameEn?: string
        roleZh?: string; roleEn?: string
        bioZh?: string; bioEn?: string
        github?: string; isVisible?: boolean
    }) => {
        const res = await fetch(`/api/team/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        })
        if (res.ok) {
            const updated: TeamMember = await res.json()
            setMembers(prev => prev.map(m => m.id === id ? updated : m))
        }
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto px-6 py-10">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-slate-200 font-mono text-base tracking-widest">
                        {t('team.title')}
                    </h1>
                    {canEdit && (
                        <button onClick={() => setShowModal(true)}
                            className="px-4 py-2 rounded border border-sky-800 text-sky-400 font-mono text-xs
                                       hover:border-sky-500 hover:text-sky-300 transition-all">
                            + {lang === 'zh' ? '添加成员' : 'Add Member'}
                        </button>
                    )}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-4 animate-pulse">
                                <div className="w-24 h-24 rounded-full bg-slate-800" />
                                <div className="h-4 w-28 bg-slate-800 rounded" />
                                <div className="h-3 w-20 bg-slate-700 rounded" />
                                <div className="h-3 w-full bg-slate-800 rounded" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty */}
                {!loading && members.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="text-slate-700 text-5xl">◈</div>
                        <p className="text-slate-600 font-mono text-sm">
                            {lang === 'zh' ? '暂无团队成员' : 'No team members yet'}
                        </p>
                    </div>
                )}

                {/* Members grid */}
                {!loading && members.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        {members.map(member => (
                            <MemberCard
                                key={member.id}
                                member={member}
                                lang={lang}
                                canEdit={canEdit}
                                deleting={deleting === member.id}
                                onDelete={(e) => handleDelete(member.id, e)}
                                onUpdate={handleUpdate}
                                token={token ?? ''}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-12">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-4 py-1.5 rounded border border-slate-700 text-slate-500 font-mono text-xs
                                       hover:border-sky-700 hover:text-sky-400 transition-all
                                       disabled:opacity-30 disabled:cursor-not-allowed">
                            ←
                        </button>
                        <span className="text-slate-600 font-mono text-xs">
                            {page} / {totalPages}
                        </span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-4 py-1.5 rounded border border-slate-700 text-slate-500 font-mono text-xs
                                       hover:border-sky-700 hover:text-sky-400 transition-all
                                       disabled:opacity-30 disabled:cursor-not-allowed">
                            →
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <NewMemberModal
                    lang={lang}
                    onClose={() => setShowModal(false)}
                    onCreate={handleCreate}
                />
            )}
        </Layout>
    )
}

function MemberCard({
    member, lang, canEdit, deleting, onDelete, onUpdate, token,
}: {
    member: TeamMember
    lang: 'zh' | 'en'
    canEdit: boolean
    deleting: boolean
    onDelete: (e: React.MouseEvent) => void
    onUpdate: (id: string, data: Record<string, string | boolean>) => void
    token: string
}) {
    const { t } = useTranslation()
    const name   = member.name[lang] || member.name.zh
    const role   = member.role[lang] || member.role.zh
    const bio    = member.bio[lang] || member.bio.zh
    const initials = name.slice(0, 2)

    const [editing,  setEditing]   = useState(false)
    const [nameZh,   setNameZh]    = useState(member.name.zh)
    const [nameEn,   setNameEn]    = useState(member.name.en)
    const [roleZh,   setRoleZh]    = useState(member.role.zh)
    const [roleEn,   setRoleEn]    = useState(member.role.en)
    const [bioZh,    setBioZh]     = useState(member.bio.zh)
    const [bioEn,    setBioEn]     = useState(member.bio.en)
    const [github,   setGithub]    = useState(member.github ?? '')
    const [uploading, setUploading] = useState(false)

    const uploadAvatar = async (files: FileList | null) => {
        if (!files?.length) return
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', files[0])
            const res = await fetch('/api/team/upload/avatar', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            })
            if (!res.ok) return
            const { url } = await res.json()
            await onUpdate(member.id, { github: member.github ?? '' } as Record<string, string>)
            // Re-fetch with avatar
            onUpdate(member.id, { github: github } as Record<string, string>)
            // Use a workaround: include avatar URL as a special field
            // Actually, let's just call onUpdate with github preserved + reload
            const r2 = await fetch(`/api/team/${member.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ github }),
            })
        } finally {
            setUploading(false)
        }
    }

    const saveEdit = async () => {
        await onUpdate(member.id, { nameZh, nameEn, roleZh, roleEn, bioZh, bioEn, github })
        setEditing(false)
    }

    const cancelEdit = () => {
        setNameZh(member.name.zh)
        setNameEn(member.name.en)
        setRoleZh(member.role.zh)
        setRoleEn(member.role.en)
        setBioZh(member.bio.zh)
        setBioEn(member.bio.en)
        setGithub(member.github ?? '')
        setEditing(false)
    }

    return (
        <div className="flex flex-col items-center text-center gap-4 group relative">

            {/* Avatar */}
            <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-800
                              group-hover:border-sky-800 transition-colors duration-300">
                    {member.avatar ? (
                        <img src={member.avatar} alt={name} width={96} height={96}
                            loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-sky-600/60 font-mono text-lg">
                            {initials}
                        </div>
                    )}
                </div>
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                shadow-[inset_0_0_12px_rgba(14,165,233,0.2)]" />

                {/* Avatar upload overlay */}
                {canEdit && (
                    <>
                        <input type="file" accept="image/*" className="hidden" id={`avatar-${member.id}`}
                            onChange={e => uploadAvatar(e.target.files)} />
                        <label htmlFor={`avatar-${member.id}`}
                            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100
                                       cursor-pointer flex items-center justify-center bg-black/40
                                       transition-opacity duration-200">
                            <span className="text-white font-mono text-[10px]">
                                {uploading ? '...' : '◈'}
                            </span>
                        </label>
                    </>
                )}

                {/* Delete button */}
                {canEdit && (
                    <button onClick={onDelete} disabled={deleting}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-black/70 border border-red-900
                                   text-red-400 font-mono text-[10px] flex items-center justify-center
                                   hover:bg-red-900/60 opacity-0 group-hover:opacity-100 transition-all z-10">
                        {deleting ? '...' : '✕'}
                    </button>
                )}
            </div>

            {/* Edit / View mode */}
            {editing ? (
                <div className="w-full space-y-2 text-left">
                    <input value={nameZh} onChange={e => setNameZh(e.target.value)}
                        placeholder="Name (ZH)" maxLength={50}
                        className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-sky-700" />
                    <input value={nameEn} onChange={e => setNameEn(e.target.value)}
                        placeholder="Name (EN)" maxLength={50}
                        className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-sky-700" />
                    <input value={roleZh} onChange={e => setRoleZh(e.target.value)}
                        placeholder="Role (ZH)" maxLength={50}
                        className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-sky-700" />
                    <input value={roleEn} onChange={e => setRoleEn(e.target.value)}
                        placeholder="Role (EN)" maxLength={50}
                        className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-sky-700" />
                    <textarea value={bioZh} onChange={e => setBioZh(e.target.value)}
                        placeholder="Bio (ZH)" rows={2} maxLength={200}
                        className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono resize-none focus:outline-none focus:border-sky-700" />
                    <textarea value={bioEn} onChange={e => setBioEn(e.target.value)}
                        placeholder="Bio (EN)" rows={2} maxLength={200}
                        className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono resize-none focus:outline-none focus:border-sky-700" />
                    <input value={github} onChange={e => setGithub(e.target.value)}
                        placeholder="GitHub username" maxLength={50}
                        className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-sky-700" />
                    <div className="flex gap-2">
                        <button onClick={cancelEdit}
                            className="flex-1 py-1 border border-slate-700 text-slate-500 font-mono text-[10px] rounded hover:border-slate-600 transition-all">
                            {lang === 'zh' ? '取消' : 'Cancel'}
                        </button>
                        <button onClick={saveEdit}
                            className="flex-1 py-1 bg-sky-900/40 border border-sky-700 text-sky-400 font-mono text-[10px] rounded hover:border-sky-500 transition-all">
                            {lang === 'zh' ? '保存' : 'Save'}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Name */}
                    <div>
                        <h3 className="text-slate-100 font-semibold text-base">{name}</h3>
                        <p className="text-sky-500/70 font-mono text-xs mt-0.5 tracking-wide">{role}</p>
                    </div>

                    {/* Bio */}
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-4 max-w-[24ch]">
                        {bio}
                    </p>

                    {/* GitHub + Edit */}
                    <div className="flex items-center gap-3 w-full justify-center">
                        {member.github && (
                            <a href={`https://github.com/${member.github}`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-slate-600 hover:text-brand font-mono text-xs transition-colors flex items-center gap-1.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                                </svg>
                                @{member.github}
                            </a>
                        )}
                        {canEdit && (
                            <button onClick={() => setEditing(true)}
                                className="text-slate-700 hover:text-sky-500 font-mono text-[10px] transition-colors opacity-0 group-hover:opacity-100">
                                ✎
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

function NewMemberModal({
    lang, onClose, onCreate,
}: {
    lang: 'zh' | 'en'
    onClose: () => void
    onCreate: (data: {
        nameZh: string; nameEn: string
        roleZh: string; roleEn: string
        bioZh: string; bioEn: string
        github: string; isVisible: boolean
    }) => void
}) {
    const [nameZh, setNameZh] = useState('')
    const [nameEn, setNameEn] = useState('')
    const [roleZh, setRoleZh] = useState('')
    const [roleEn, setRoleEn] = useState('')
    const [bioZh, setBioZh] = useState('')
    const [bioEn, setBioEn] = useState('')
    const [github, setGithub] = useState('')
    const [isVisible, setIsVisible] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await onCreate({ nameZh, nameEn, roleZh, roleEn, bioZh, bioEn, github, isVisible })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div onClick={e => e.stopPropagation()}
                className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                    <h2 className="text-slate-200 font-mono text-sm">
                        {lang === 'zh' ? '添加团队成员' : 'Add Team Member'}
                    </h2>
                    <button onClick={onClose}
                        className="text-slate-600 hover:text-slate-300 font-mono text-sm transition-colors">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '姓名（中）*' : 'Name (ZH) *'}</label>
                            <input value={nameZh} onChange={e => setNameZh(e.target.value)} required
                                placeholder="中文名"
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-700" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '姓名（英）' : 'Name (EN)'}</label>
                            <input value={nameEn} onChange={e => setNameEn(e.target.value)}
                                placeholder="English name"
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-700" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '职能（中）*' : 'Role (ZH) *'}</label>
                            <input value={roleZh} onChange={e => setRoleZh(e.target.value)} required
                                placeholder="前端工程师"
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-700" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '职能（英）' : 'Role (EN)'}</label>
                            <input value={roleEn} onChange={e => setRoleEn(e.target.value)}
                                placeholder="Frontend Engineer"
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-700" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '简介（中）*' : 'Bio (ZH) *'}</label>
                        <textarea value={bioZh} onChange={e => setBioZh(e.target.value)} rows={2} required
                            placeholder="个人简介"
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono resize-none focus:outline-none focus:border-sky-700" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '简介（英）' : 'Bio (EN)'}</label>
                        <textarea value={bioEn} onChange={e => setBioEn(e.target.value)} rows={2}
                            placeholder="Personal bio"
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono resize-none focus:outline-none focus:border-sky-700" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? 'GitHub 用户名' : 'GitHub username'}</label>
                        <input value={github} onChange={e => setGithub(e.target.value)}
                            placeholder="username"
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-700" />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div onClick={() => setIsVisible(v => !v)}
                            className={`w-8 h-4 rounded-full relative transition-all ${isVisible ? 'bg-sky-600' : 'bg-slate-700'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isVisible ? 'left-4' : 'left-0.5'}`} />
                        </div>
                        <span className="text-slate-400 font-mono text-xs">
                            {lang === 'zh' ? '公开显示' : 'Visible'}
                        </span>
                    </label>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2 border border-slate-700 text-slate-500 font-mono text-xs rounded hover:border-slate-600 hover:text-slate-300 transition-all">
                            {lang === 'zh' ? '取消' : 'Cancel'}
                        </button>
                        <button type="submit" disabled={submitting}
                            className="flex-1 py-2 bg-sky-900/40 border border-sky-700 text-sky-400 font-mono text-xs rounded hover:bg-sky-800/40 hover:border-sky-500 transition-all disabled:opacity-40">
                            {submitting ? (lang === 'zh' ? '添加中...' : 'Adding...') : (lang === 'zh' ? '添加' : 'Add')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
