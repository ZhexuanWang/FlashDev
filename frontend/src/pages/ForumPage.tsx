import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ForumPost } from '../types/forum'
import { Layout } from '../components/Layout'
import { useAuthStore } from '../store/authStore'
import { useEditorStore } from '../store/editorStore'

const LIMIT = 20

interface ForumSection {
    id: string
    name: Record<string, string>
    description?: Record<string, string>
    icon: string
    order: number
    groups: (ForumGroup & { _count?: { posts: number } })[]
}

interface ForumGroup {
    id: string
    sectionId: string
    name: Record<string, string>
    description?: Record<string, string>
    order: number
    section?: { id: string; name: Record<string, string> }
}

interface PaginatedPosts {
    posts: ForumPost[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export default function ForumPage() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const navigate = useNavigate()
    const { token } = useAuthStore()
    const { role } = useEditorStore()
    const isLoggedIn = !!token
    const canManage = !!(token && (role === 'COMPANY' || role === 'ADMIN'))

    const [sections,   setSections]   = useState<ForumSection[]>([])
    const [posts,      setPosts]      = useState<PaginatedPosts | null>(null)
    const [loading,    setLoading]    = useState(true)
    const [page,       setPage]       = useState(1)
    const [showModal,  setShowModal]  = useState(false)
    const [search,     setSearch]     = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    // Selection state
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
    const [activeGroupId,   setActiveGroupId]   = useState<string | null>(null)
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

    // Section/Group admin modal state
    const [showSectionModal, setShowSectionModal] = useState(false)
    const [showGroupModal,   setShowGroupModal]   = useState(false)
    const [editingSection,   setEditingSection]   = useState<ForumSection | null>(null)
    const [editingGroup,     setEditingGroup]     = useState<ForumGroup | null>(null)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(timer)
    }, [search])

    // Load sections (with groups embedded)
    useEffect(() => {
        fetch('/api/forum/sections')
            .then(r => r.ok ? r.json() : [])
            .then((data: ForumSection[]) => {
                setSections(data)
                // Auto-expand first section
                if (data.length > 0 && expandedSections.size === 0) {
                    setExpandedSections(new Set([data[0].id]))
                }
            })
            .catch(() => {})
    }, [])

    // Load posts
    const fetchPosts = (pg: number) => {
        setLoading(true)
        const params = new URLSearchParams({ page: String(pg), limit: String(LIMIT) })
        if (debouncedSearch) params.set('tag', debouncedSearch)
        if (activeGroupId) params.set('groupId', activeGroupId)
        fetch(`/api/forum/posts?${params}`)
            .then(r => r.json())
            .then((d: PaginatedPosts) => setPosts(d))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchPosts(page) }, [page, debouncedSearch, activeGroupId])
    useEffect(() => { setPage(1) }, [activeGroupId, debouncedSearch])

    // Filter groups by active section
    const groupsForSection = (sectionId: string) =>
        groups.filter(g => g.sectionId === sectionId)

    const allTags = posts ? Array.from(new Set(posts.posts.flatMap(p => p.tags))) : []

    const handleCreate = async (body: { title: string; content: string; tags?: string[] }) => {
        if (!token) return
        const res = await fetch('/api/forum/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title: body.title, content: body.content, tags: body.tags }),
        })
        if (res.ok) {
            setShowModal(false)
            fetchPosts(1)
        }
    }

    // Flat list of all groups for groupId → group lookup
    const allGroups = sections.flatMap(s => s.groups ?? [])

    const handleUpvote = async (postId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!token) { alert(lang === 'zh' ? '请先登录' : 'Please login first'); return }
        const res = await fetch(`/api/forum/posts/${postId}/upvote`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
            setPosts(prev => prev ? {
                ...prev,
                posts: prev.posts.map(p => p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p),
            } : prev)
        }
    }

    const handleToggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev)
            if (next.has(sectionId)) next.delete(sectionId)
            else next.add(sectionId)
            return next
        })
    }

    const handleSelectSection = (sectionId: string | null) => {
        setActiveSectionId(sectionId)
        setActiveGroupId(null)
    }

    const handleSelectGroup = (group: ForumGroup) => {
        setActiveSectionId(group.sectionId)
        setActiveGroupId(group.id)
        setExpandedSections(prev => {
            const next = new Set(prev)
            next.add(group.sectionId)
            return next
        })
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="flex gap-8">

                    {/* ── Left sidebar: sections + groups tree ── */}
                    <aside className="w-48 flex-shrink-0 space-y-1">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-600 font-mono text-[10px] tracking-widest uppercase">
                                {t('forum.sections')}
                            </span>
                            {canManage && (
                                <button onClick={() => { setEditingSection(null); setShowSectionModal(true) }}
                                    className="text-sky-600 hover:text-sky-400 font-mono text-[10px]">+</button>
                            )}
                        </div>

                        {/* All posts link */}
                        <button
                            onClick={() => { setActiveSectionId(null); setActiveGroupId(null) }}
                            className={`w-full text-left px-2 py-1.5 rounded font-mono text-[11px] border transition-all
                                ${!activeSectionId && !activeGroupId
                                    ? 'border-sky-800 text-sky-400 bg-sky-950/30'
                                    : 'border-transparent text-slate-600 hover:text-slate-400'}`}>
                            {t('forum.allTopics')}
                        </button>

                        {/* Section list */}
                        {sections.map(section => {
                            const isExpanded = expandedSections.has(section.id)
                            const isSectionActive = activeSectionId === section.id && !activeGroupId
                            const sectionGroups = groupsForSection(section.id)

                            return (
                                <div key={section.id}>
                                    {/* Section header */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleToggleSection(section.id)}
                                            className="text-slate-700 hover:text-slate-400 font-mono text-[10px] transition-colors w-4">
                                            {isExpanded ? '▼' : '▶'}
                                        </button>
                                        <button
                                            onClick={() => { handleSelectSection(section.id); handleToggleSection(section.id) }}
                                            className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded font-mono text-[11px] border transition-all
                                                ${isSectionActive
                                                    ? 'border-sky-800 text-sky-400 bg-sky-950/30'
                                                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'}`}>
                                            <span>{section.icon}</span>
                                            <span className="truncate">{section.name[lang] || section.name.zh}</span>
                                            {canManage && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingSection(section); setShowSectionModal(true) }}
                                                    className="ml-auto text-sky-700 hover:text-sky-400 text-[9px]">✎</button>
                                            )}
                                        </button>
                                    </div>

                                    {/* Groups under this section */}
                                    {isExpanded && sectionGroups.length > 0 && (
                                        <div className="ml-5 mt-0.5 space-y-0.5">
                                            {sectionGroups.map(group => {
                                                const isGroupActive = activeGroupId === group.id
                                                const postCount = group._count?.posts ?? 0
                                                return (
                                                    <div key={group.id} className="flex items-center w-full group/gi">
                                                        <button
                                                            onClick={() => handleSelectGroup(group)}
                                                            className={`flex-1 flex items-center justify-between px-2 py-1 rounded font-mono text-[10px] border transition-all
                                                                ${isGroupActive
                                                                    ? 'border-sky-700 text-sky-300 bg-sky-950/20'
                                                                    : 'border-transparent text-slate-600 hover:text-slate-400 hover:bg-slate-900/20'}`}>
                                                            <span className="truncate">{group.name[lang] || group.name.zh}</span>
                                                            <span className="text-slate-700 ml-1">({postCount})</span>
                                                        </button>
                                                        {canManage && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setEditingGroup(group); setShowGroupModal(true) }}
                                                                className="ml-1 flex-shrink-0 text-sky-700 hover:text-sky-400 text-[9px] opacity-0 group-hover/gi:opacity-100 transition-opacity">✎</button>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                            {canManage && (
                                                <button
                                                    onClick={() => { setEditingGroup({ id: '', sectionId: section.id, name: { zh: '', en: '' }, order: 0 } as ForumGroup); setShowGroupModal(true) }}
                                                    className="w-full text-left px-2 py-1 font-mono text-[10px] text-sky-800 hover:text-sky-500 transition-colors">
                                                    + {t('forum.addGroup')}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {sections.length === 0 && !canManage && (
                            <p className="text-slate-700 font-mono text-[10px] px-2 py-4 text-center">
                                {lang === 'zh' ? '暂无板块' : 'No sections yet'}
                            </p>
                        )}
                    </aside>

                    {/* ── Main content ── */}
                    <div className="flex-1 min-w-0">

                        {/* Header + actions */}
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-slate-200 font-mono text-base tracking-widest">
                                {activeGroupId
                                    ? (allGroups.find(g => g.id === activeGroupId)?.name[lang] || allGroups.find(g => g.id === activeGroupId)?.name.zh || t('forum.title'))
                                    : activeSectionId
                                        ? (sections.find(s => s.id === activeSectionId)?.name[lang] || sections.find(s => s.id === activeSectionId)?.name.zh || t('forum.title'))
                                        : t('forum.title')
                                }
                            </h1>
                            {isLoggedIn ? (
                                <button onClick={() => setShowModal(true)}
                                    className="px-4 py-2 rounded border border-amber-900 text-amber-400 font-mono text-xs
                                               hover:border-amber-600 hover:text-amber-300 transition-all">
                                    + {t('forum.newTopic')}
                                </button>
                            ) : (
                                <span className="text-slate-700 font-mono text-xs">
                                    {t('forum.loginToJoin')}
                                </span>
                            )}
                        </div>

                        {/* Not logged in banner */}
                        {!isLoggedIn && (
                            <div className="mb-6 p-4 rounded-lg border border-amber-900/40 bg-amber-950/20 flex items-center gap-4">
                                <span className="text-2xl">💬</span>
                                <div>
                                    <p className="text-amber-400 font-mono text-xs">
                                        {t('forum.loginToPost')}
                                    </p>
                                </div>
                                <button onClick={() => navigate('/login')}
                                    className="ml-auto px-3 py-1.5 rounded border border-amber-800 text-amber-500 font-mono text-xs hover:border-amber-600 transition-all">
                                    {lang === 'zh' ? '登录' : 'Login'}
                                </button>
                            </div>
                        )}

                        {/* Search */}
                        <div className="relative mb-5">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm">🔍</span>
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder={t('forum.searchTopics')}
                                className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded text-slate-200 font-mono text-xs
                                           placeholder:text-slate-600 focus:outline-none focus:border-sky-700 transition-all" />
                        </div>

                        {/* Tag filter */}
                        {allTags.length > 0 && (
                            <div className="flex gap-2 flex-wrap mb-6">
                                <button onClick={() => setSearch('')}
                                    className={`px-3 py-1 rounded font-mono text-xs border transition-all
                                        ${!debouncedSearch
                                            ? 'border-sky-700 text-sky-400 bg-sky-950/30'
                                            : 'border-slate-800 text-slate-600 hover:border-slate-600'}`}>
                                    {lang === 'zh' ? '全部' : 'All'}
                                </button>
                                {allTags.map(tag => (
                                    <button key={tag} onClick={() => setSearch(tag)}
                                        className={`px-3 py-1 rounded font-mono text-xs border transition-all
                                            ${debouncedSearch === tag
                                                ? 'border-amber-800 text-amber-400 bg-amber-950/30'
                                                : 'border-slate-800 text-slate-600 hover:border-slate-600'}`}>
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Loading */}
                        {loading && (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="p-4 rounded-lg bg-slate-900/40 border border-slate-800 animate-pulse">
                                        <div className="h-4 bg-slate-800 rounded w-2/3 mb-2" />
                                        <div className="h-3 bg-slate-800 rounded w-full" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty */}
                        {!loading && (!posts || posts.posts.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-32 gap-4">
                                <div className="text-slate-700 text-5xl">◈</div>
                                <p className="text-slate-600 font-mono text-sm">
                                    {t('forum.noTopics')}
                                </p>
                            </div>
                        )}

                        {/* Posts */}
                        {!loading && posts && posts.posts.length > 0 && (
                            <div className="space-y-3">
                                {posts.posts.map(post => (
                                    <ForumCard
                                        key={post.id}
                                        post={post}
                                        lang={lang}
                                        isLoggedIn={isLoggedIn}
                                        onUpvote={(e) => handleUpvote(post.id, e)}
                                        onClick={() => navigate(`/forum/posts/${post.id}`)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && posts && posts.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-10">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="px-4 py-1.5 rounded border border-slate-700 text-slate-500 font-mono text-xs
                                               hover:border-amber-700 hover:text-amber-400 transition-all disabled:opacity-30">
                                    ←
                                </button>
                                <span className="text-slate-600 font-mono text-xs">{page} / {posts.totalPages}</span>
                                <button onClick={() => setPage(p => Math.min(posts.totalPages, p + 1))}
                                    disabled={page >= posts.totalPages}
                                    className="px-4 py-1.5 rounded border border-slate-700 text-slate-500 font-mono text-xs
                                               hover:border-amber-700 hover:text-amber-400 transition-all disabled:opacity-30">
                                    →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showModal && (
                <NewTopicModal lang={lang} onClose={() => setShowModal(false)} onCreate={handleCreate} />
            )}

            {showSectionModal && (
                <SectionModal
                    section={editingSection}
                    lang={lang}
                    onClose={() => setShowSectionModal(false)}
                    onSaved={(s) => {
                        if (editingSection) {
                            setSections(prev => prev.map(x => x.id === s.id ? { ...x, ...s } : x))
                        } else {
                            setSections(prev => [...prev, s as ForumSection])
                        }
                        setShowSectionModal(false)
                    }}
                />
            )}

            {showGroupModal && (
                <GroupModal
                    group={editingGroup}
                    sections={sections}
                    lang={lang}
                    onClose={() => setShowGroupModal(false)}
                    onSaved={(g) => {
                        if (editingGroup?.id) {
                            setGroups(prev => prev.map(x => x.id === g.id ? { ...x, ...g } : x))
                        } else {
                            setGroups(prev => [...prev, g as ForumGroup])
                        }
                        setShowGroupModal(false)
                    }}
                />
            )}
        </Layout>
    )
}

// ─────────────────────────────────────────────
// ForumCard
// ─────────────────────────────────────────────
function ForumCard({
    post, lang, isLoggedIn, onUpvote, onClick,
}: {
    post: ForumPost
    lang: 'zh' | 'en'
    isLoggedIn: boolean
    onUpvote: (e: React.MouseEvent) => void
    onClick: () => void
}) {
    const date = new Date(post.createdAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    })

    return (
        <div onClick={onClick}
            className="flex gap-4 p-4 rounded-lg bg-slate-900/40 border border-slate-800
                       hover:border-amber-800/60 transition-all cursor-pointer group">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <button onClick={onUpvote}
                    className={`text-lg transition-colors ${isLoggedIn ? 'hover:text-amber-400' : 'cursor-default opacity-50'}`}>
                    ▲
                </button>
                <span className="text-amber-400 font-mono text-xs">{post.upvotes}</span>
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-slate-200 font-medium text-sm line-clamp-1 group-hover:text-amber-300 transition-colors mb-1">
                    {post.title}
                </h3>
                <p className="text-slate-600 font-mono text-[10px] line-clamp-1 mb-2">
                    {post.author?.email ?? (lang === 'zh' ? '匿名用户' : 'Anonymous')} · {date}
                </p>
                <div className="flex items-center gap-2">
                    {post.tags.slice(0, 4).map(tag => (
                        <span key={tag}
                            className="text-slate-700 font-mono text-[10px] border border-slate-800 rounded px-1.5 py-0.5">
                            #{tag}
                        </span>
                    ))}
                    <span className="ml-auto text-slate-700 font-mono text-[10px]">
                        💬 {(post as any)._count?.comments ?? 0}
                    </span>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// NewTopicModal
// ─────────────────────────────────────────────
function NewTopicModal({ lang, onClose, onCreate }: {
    lang: 'zh' | 'en'
    onClose: () => void
    onCreate: (data: { title: string; content: string; tags?: string[] }) => void
}) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [tags, setTags] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await onCreate({
                title, content,
                tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            })
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
                    <h2 className="text-slate-200 font-mono text-sm">{lang === 'zh' ? '发布新话题' : 'New Topic'}</h2>
                    <button onClick={onClose} className="text-slate-600 hover:text-slate-300 font-mono text-sm">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '标题 *' : 'Title *'}</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} required
                            placeholder={lang === 'zh' ? '分享一个有趣的想法...' : 'Share an interesting idea...'}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-amber-700 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '内容 *' : 'Content *'}</label>
                        <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} required
                            placeholder={lang === 'zh' ? '详细描述你的想法...' : 'Describe your idea in detail...'}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono resize-none focus:outline-none focus:border-amber-700 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '标签（逗号分隔）' : 'Tags'}</label>
                        <input value={tags} onChange={e => setTags(e.target.value)}
                            placeholder="AI, Vibe Coding, 工具"
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-amber-700 transition-all" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2 border border-slate-700 text-slate-500 font-mono text-xs rounded hover:border-slate-600 transition-all">
                            {lang === 'zh' ? '取消' : 'Cancel'}
                        </button>
                        <button type="submit" disabled={submitting}
                            className="flex-1 py-2 bg-amber-950/40 border border-amber-800 text-amber-400 font-mono text-xs rounded hover:border-amber-600 transition-all disabled:opacity-40">
                            {submitting ? (lang === 'zh' ? '发布中...' : 'Posting...') : (lang === 'zh' ? '发布' : 'Post')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// SectionModal (create/edit)
// ─────────────────────────────────────────────
function SectionModal({ section, lang, onClose, onSaved }: {
    section: ForumSection | null
    lang: 'zh' | 'en'
    onClose: () => void
    onSaved: (s: any) => void
}) {
    const { token } = useEditorStore()
    const [nameZh, setNameZh] = useState(section?.name.zh ?? '')
    const [nameEn, setNameEn] = useState(section?.name.en ?? '')
    const [icon,   setIcon]   = useState(section?.icon ?? '📂')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!token) return
        setSaving(true)
        try {
            if (section?.id) {
                const res = await fetch(`/api/forum/sections/${section.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ nameZh, nameEn, icon }),
                })
                if (res.ok) onSaved(await res.json())
            } else {
                const res = await fetch('/api/forum/sections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ nameZh, nameEn, icon }),
                })
                if (res.ok) onSaved(await res.json())
            }
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!token || !section?.id || !confirm(lang === 'zh' ? '确认删除此板块？' : 'Delete this section?')) return
        await fetch(`/api/forum/sections/${section.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        })
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div onClick={e => e.stopPropagation()} className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-lg shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                    <h2 className="text-slate-200 font-mono text-sm">
                        {section ? (lang === 'zh' ? '编辑板块' : 'Edit Section') : (lang === 'zh' ? '新建板块' : 'New Section')}
                    </h2>
                    <button onClick={onClose} className="text-slate-600 hover:text-slate-300 font-mono text-sm">✕</button>
                </div>
                <div className="p-5 space-y-3">
                    <div className="space-y-1">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '图标 (emoji)' : 'Icon (emoji)'}</label>
                        <input value={icon} onChange={e => setIcon(e.target.value)} maxLength={4}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-700" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '名称（中）*' : 'Name (ZH) *'}</label>
                        <input value={nameZh} onChange={e => setNameZh(e.target.value)} required
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-700" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '名称（英）' : 'Name (EN)'}</label>
                        <input value={nameEn} onChange={e => setNameEn(e.target.value)}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-700" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        {section && (
                            <button type="button" onClick={handleDelete}
                                className="px-3 py-2 border border-red-900 text-red-400 font-mono text-xs rounded hover:border-red-700 transition-all">
                                {lang === 'zh' ? '删除' : 'Delete'}
                            </button>
                        )}
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2 border border-slate-700 text-slate-500 font-mono text-xs rounded hover:border-slate-600 transition-all">
                            {lang === 'zh' ? '取消' : 'Cancel'}
                        </button>
                        <button type="button" onClick={handleSave} disabled={saving}
                            className="flex-1 py-2 bg-sky-900/40 border border-sky-700 text-sky-400 font-mono text-xs rounded hover:border-sky-500 transition-all disabled:opacity-40">
                            {saving ? '...' : (lang === 'zh' ? '保存' : 'Save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// GroupModal (create only — editing done inline)
// ─────────────────────────────────────────────
function GroupModal({ group, sections, lang, onClose, onSaved }: {
    group: ForumGroup | null
    sections: ForumSection[]
    lang: 'zh' | 'en'
    onClose: () => void
    onSaved: (g: any) => void
}) {
    const { token } = useEditorStore()
    const [nameZh, setNameZh] = useState(group?.name.zh ?? '')
    const [nameEn, setNameEn] = useState(group?.name.en ?? '')
    const [sectionId, setSectionId] = useState(group?.sectionId ?? sections[0]?.id ?? '')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!token) return
        setSaving(true)
        try {
            const url = group?.id ? `/api/forum/groups/${group.id}` : '/api/forum/groups'
            const method = group?.id ? 'PATCH' : 'POST'
            const body: Record<string, string> = { sectionId, nameZh, nameEn }
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            })
            if (res.ok) onSaved(await res.json())
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!token || !group?.id || !confirm(lang === 'zh' ? '确认删除此讨论组？' : 'Delete this group?')) return
        await fetch(`/api/forum/groups/${group.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        })
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div onClick={e => e.stopPropagation()} className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-lg shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                    <h2 className="text-slate-200 font-mono text-sm">{group ? (lang === 'zh' ? '编辑讨论组' : 'Edit Group') : (lang === 'zh' ? '新建讨论组' : 'New Group')}</h2>
                    <button onClick={onClose} className="text-slate-600 hover:text-slate-300 font-mono text-sm">✕</button>
                </div>
                <div className="p-5 space-y-3">
                    <div className="space-y-1">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '所属板块 *' : 'Section *'}</label>
                        <select value={sectionId} onChange={e => setSectionId(e.target.value)}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-700">
                            {sections.map(s => (
                                <option key={s.id} value={s.id}>{s.icon} {s.name[lang] || s.name.zh}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '名称（中）*' : 'Name (ZH) *'}</label>
                        <input value={nameZh} onChange={e => setNameZh(e.target.value)} required
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-700" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '名称（英）' : 'Name (EN)'}</label>
                        <input value={nameEn} onChange={e => setNameEn(e.target.value)}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-700" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        {group && (
                            <button type="button" onClick={handleDelete}
                                className="px-3 py-2 border border-red-900 text-red-400 font-mono text-xs rounded hover:border-red-700 transition-all">
                                {lang === 'zh' ? '删除' : 'Delete'}
                            </button>
                        )}
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2 border border-slate-700 text-slate-500 font-mono text-xs rounded hover:border-slate-600 transition-all">
                            {lang === 'zh' ? '取消' : 'Cancel'}
                        </button>
                        <button type="button" onClick={handleSave} disabled={saving}
                            className="flex-1 py-2 bg-sky-900/40 border border-sky-700 text-sky-400 font-mono text-xs rounded hover:border-sky-500 transition-all disabled:opacity-40">
                            {saving ? '...' : (lang === 'zh' ? '保存' : 'Save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
