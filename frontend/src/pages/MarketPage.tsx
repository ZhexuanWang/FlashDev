import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MarketPost, MarketStatus } from '../types/market'
import { Layout } from '../components/Layout'
import { useAuthStore } from '../store/authStore'

const LIMIT = 12

const STATUS_LABELS: Record<MarketStatus, { zh: string; en: string }> = {
    OPEN:        { zh: '招募中', en: 'Open' },
    IN_PROGRESS: { zh: '进行中', en: 'In Progress' },
    CLOSED:      { zh: '已关闭', en: 'Closed' },
}

const STATUS_COLORS: Record<MarketStatus, string> = {
    OPEN:        'text-emerald-400 border-emerald-800',
    IN_PROGRESS: 'text-amber-400 border-amber-800',
    CLOSED:      'text-slate-600 border-slate-700',
}

export default function MarketPage() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const { token } = useAuthStore()
    const isLoggedIn = !!token

    const [data, setData] = useState<{ posts: MarketPost[]; total: number; totalPages: number } | null>(null)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<MarketStatus | 'all'>('all')
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => { fetchPosts(1) }, [debouncedSearch, statusFilter])

    const fetchPosts = (pg: number) => {
        setLoading(true)
        const params = new URLSearchParams({ page: String(pg), limit: String(LIMIT) })
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (statusFilter !== 'all') params.set('status', statusFilter)
        fetch(`/api/market?${params}`)
            .then(r => r.json())
            .then(d => setData(d))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchPosts(page) }, [page])

    const handleCreate = async (body: {
        title: string; description: string; budget?: number
        timeline?: string; tags?: string[]
    }) => {
        if (!token) return
        const res = await fetch('/api/market', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        })
        if (res.ok) { setShowModal(false); fetchPosts(1) }
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto px-6 py-10">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-slate-200 font-mono text-base tracking-widest">
                        {t('market.title')}
                    </h1>
                    {isLoggedIn && (
                        <button onClick={() => setShowModal(true)}
                            className="px-4 py-2 rounded border border-emerald-900 text-emerald-400 font-mono text-xs
                                       hover:border-emerald-600 hover:text-emerald-300 transition-all">
                            + {lang === 'zh' ? '发布需求' : 'Post Request'}
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm">🔍</span>
                    <input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                        placeholder={lang === 'zh' ? '搜索项目需求...' : 'Search project requests...'}
                        className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded text-slate-200 font-mono text-xs
                                   placeholder:text-slate-600 focus:outline-none focus:border-sky-700 transition-all"
                    />
                </div>

                {/* Status filter */}
                <div className="flex gap-2 mb-8">
                    {(['all', 'OPEN', 'IN_PROGRESS', 'CLOSED'] as const).map(s => (
                        <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
                            className={`px-3 py-1 rounded font-mono text-xs border transition-all
                                ${statusFilter === s
                                    ? 'bg-emerald-950/40 border-emerald-700 text-emerald-400'
                                    : 'border-slate-800 text-slate-600 hover:border-slate-600'}`}>
                            {s === 'all' ? (lang === 'zh' ? '全部' : 'All')
                                : STATUS_LABELS[s as MarketStatus][lang]}
                        </button>
                    ))}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="p-5 rounded-lg bg-slate-900/40 border border-slate-800 animate-pulse">
                                <div className="h-4 bg-slate-800 rounded w-1/3 mb-2" />
                                <div className="h-3 bg-slate-800 rounded w-full mb-2" />
                                <div className="h-3 bg-slate-800 rounded w-2/3" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty */}
                {!loading && (!data || data.posts.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="text-slate-700 text-5xl">◈</div>
                        <p className="text-slate-600 font-mono text-sm">
                            {debouncedSearch
                                ? (lang === 'zh' ? '没有找到匹配的项目' : 'No matching projects found')
                                : (lang === 'zh' ? '暂无需求' : 'No requests yet')
                            }
                        </p>
                    </div>
                )}

                {/* Posts */}
                {!loading && data && data.posts.length > 0 && (
                    <div className="space-y-4">
                        {data.posts.map(post => (
                            <MarketCard key={post.id} post={post} lang={lang} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && data && data.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-10">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-4 py-1.5 rounded border border-slate-700 text-slate-500 font-mono text-xs
                                       hover:border-emerald-700 hover:text-emerald-400 transition-all
                                       disabled:opacity-30 disabled:cursor-not-allowed">
                            ←
                        </button>
                        <span className="text-slate-600 font-mono text-xs">{page} / {data.totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                            disabled={page >= data.totalPages}
                            className="px-4 py-1.5 rounded border border-slate-700 text-slate-500 font-mono text-xs
                                       hover:border-emerald-700 hover:text-emerald-400 transition-all
                                       disabled:opacity-30 disabled:cursor-not-allowed">
                            →
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <MarketPostModal lang={lang} onClose={() => setShowModal(false)} onCreate={handleCreate} />
            )}
        </Layout>
    )
}

function MarketCard({ post, lang }: { post: MarketPost; lang: 'zh' | 'en' }) {
    const date = new Date(post.createdAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    })

    return (
        <div className="p-5 rounded-lg bg-slate-900/40 border border-slate-800
                       hover:border-emerald-900/60 transition-all duration-300 group">
            <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-slate-200 font-medium text-sm group-hover:text-emerald-300 transition-colors">
                    {post.title}
                </h3>
                <span className={`flex-shrink-0 px-2 py-0.5 rounded border font-mono text-[10px] ${STATUS_COLORS[post.status]}`}>
                    {STATUS_LABELS[post.status][lang]}
                </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-3">
                {post.description}
            </p>
            <div className="flex items-center gap-4">
                {post.budget !== null && (
                    <span className="text-emerald-400 font-mono text-xs">
                        ¥{post.budget.toLocaleString()}
                    </span>
                )}
                {post.timeline && (
                    <span className="text-slate-700 font-mono text-[10px]">
                        ⏱ {post.timeline}
                    </span>
                )}
                {post.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-slate-700 font-mono text-[10px] border border-slate-800 rounded px-1.5 py-0.5">
                        #{tag}
                    </span>
                ))}
                <span className="ml-auto text-slate-700 font-mono text-[10px]">
                    {date}
                </span>
            </div>
        </div>
    )
}

function MarketPostModal({
    lang, onClose, onCreate,
}: {
    lang: 'zh' | 'en'
    onClose: () => void
    onCreate: (data: { title: string; description: string; budget?: number; timeline?: string; tags?: string[] }) => void
}) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [budget, setBudget] = useState('')
    const [timeline, setTimeline] = useState('')
    const [tags, setTags] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await onCreate({
                title,
                description,
                budget: budget ? parseFloat(budget) : undefined,
                timeline: timeline || undefined,
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
                    <h2 className="text-slate-200 font-mono text-sm">
                        {lang === 'zh' ? '发布项目需求' : 'Post Project Request'}
                    </h2>
                    <button onClick={onClose}
                        className="text-slate-600 hover:text-slate-300 font-mono text-sm transition-colors">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '项目标题 *' : 'Title *'}</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} required
                            placeholder={lang === 'zh' ? '需要开发一个 Vibe Coding 项目' : 'Need a Vibe Coding project built'}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-emerald-700 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '需求描述 *' : 'Description *'}</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} required
                            placeholder={lang === 'zh' ? '详细描述你的需求...' : 'Describe your project in detail...'}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono resize-none focus:outline-none focus:border-emerald-700 transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '预算（元）' : 'Budget (¥)'}</label>
                            <input value={budget} onChange={e => setBudget(e.target.value)} type="number"
                                placeholder="5000"
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-emerald-700 transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '预计时间' : 'Timeline'}</label>
                            <input value={timeline} onChange={e => setTimeline(e.target.value)}
                                placeholder={lang === 'zh' ? '2周' : '2 weeks'}
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-emerald-700 transition-all" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '标签（逗号分隔）' : 'Tags (comma-separated)'}</label>
                        <input value={tags} onChange={e => setTags(e.target.value)}
                            placeholder={lang === 'zh' ? 'AI, 前端, React' : 'AI, Frontend, React'}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-emerald-700 transition-all" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2 border border-slate-700 text-slate-500 font-mono text-xs rounded hover:border-slate-600 transition-all">
                            {lang === 'zh' ? '取消' : 'Cancel'}
                        </button>
                        <button type="submit" disabled={submitting}
                            className="flex-1 py-2 bg-emerald-950/40 border border-emerald-800 text-emerald-400 font-mono text-xs rounded hover:border-emerald-600 transition-all disabled:opacity-40">
                            {submitting ? (lang === 'zh' ? '发布中...' : 'Posting...') : (lang === 'zh' ? '发布' : 'Post')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
