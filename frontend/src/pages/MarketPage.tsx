import { useEffect, useState, useCallback } from 'react'
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
    OPEN:        'text-sky-400 border-sky-800',
    IN_PROGRESS: 'text-amber-400 border-amber-800',
    CLOSED:      'text-slate-600 border-slate-700',
}

type ViewMode = 'list' | 'grid'

interface ToastState { message: string; visible: boolean }

const PROGRAMMING_TYPES = [
    { key: 'webDev',   zh: 'Web开发',      en: 'Web Dev',      match: ['web', 'webdev', 'frontend', '前端', 'react', 'vue', 'next', 'nuxt'] },
    { key: 'aiMl',     zh: 'AI/ML',        en: 'AI/ML',        match: ['ai', 'ml', 'nlp', 'llm', 'gpt', 'deep-learning', 'torch', 'tensorflow'] },
    { key: 'mobile',   zh: '移动端',        en: 'Mobile',       match: ['mobile', 'ios', 'android', 'flutter', 'react-native', '小程序'] },
    { key: 'backend',  zh: '后端/服务器',   en: 'Backend',      match: ['backend', 'server', 'api', 'node', 'python', 'go', 'java', '后端'] },
    { key: 'game',     zh: '游戏',          en: 'Game',         match: ['game', 'unity', 'unreal', 'godot', 'cocos', 'three', 'phaser'] },
    { key: 'dataViz',  zh: '数据可视化',    en: 'Data Viz',     match: ['d3', 'echarts', 'chart', 'visualization', 'dashboard', '可视化', 'bi'] },
    { key: 'other',    zh: '其他',          en: 'Other',        match: [] },
]

const BUDGET_RANGES = [
    { key: 'negotiable', labelKey: 'budget_negotiable', min: -1,         max: 0   },
    { key: 'under1k',    labelKey: 'budget_under1k',     min: 0.001,      max: 999 },
    { key: 'range',      labelKey: 'budget_range',       min: 1000,       max: 5000 },
    { key: 'range2',     labelKey: 'budget_range2',      min: 5000.001,   max: 10000 },
    { key: 'above10k',   labelKey: 'budget_above10k',    min: 10000.001,  max: Infinity },
]

function matchType(tags: string[]): string | null {
    const lower = tags.map(t => t.toLowerCase())
    for (const t of PROGRAMMING_TYPES) {
        if (t.key === 'other') continue
        if (lower.some(tag => t.match.includes(tag))) return t.key
    }
    return null
}

function matchBudget(budget: number | null, rangeKey: string): boolean {
    if (rangeKey === 'negotiable') return budget === null || budget === 0
    if (budget === null || budget === 0) return false
    const r = BUDGET_RANGES.find(r => r.key === rangeKey)!
    return budget >= r.min && budget <= r.max
}

function Toast({ message, visible }: ToastState) {
    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded border border-sky-800 bg-slate-900/90 text-sky-400 backdrop-blur-sm font-mono text-xs transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
            {message}
        </div>
    )
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
    const [typeFilter, setTypeFilter] = useState<string | 'all'>('all')
    const [budgetFilter, setBudgetFilter] = useState<string | 'all'>('all')
    const [tagFilter, setTagFilter] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [showPostModal, setShowPostModal] = useState(false)
    const [detailPost, setDetailPost] = useState<MarketPost | null>(null)
    const [toast, setToast] = useState<ToastState>({ message: '', visible: false })

    const showToast = useCallback((msg: string) => {
        setToast({ message: msg, visible: true })
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200)
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400)
        return () => clearTimeout(timer)
    }, [search])

    const fetchPosts = useCallback((pg: number) => {
        setLoading(true)
        const params = new URLSearchParams({ page: String(pg), limit: String(LIMIT) })
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (statusFilter !== 'all') params.set('status', statusFilter)
        fetch(`/api/market?${params}`)
            .then(r => r.json())
            .then(d => setData(d))
            .finally(() => setLoading(false))
    }, [debouncedSearch, statusFilter])

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { fetchPosts(1) }, [fetchPosts])
    useEffect(() => { fetchPosts(page) }, [page, fetchPosts])

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
        if (res.ok) { setShowPostModal(false); fetchPosts(1) }
    }

    // Gather all unique tags from posts for tag cloud
    const allTags = data
        ? Array.from(new Set(data.posts.flatMap(p => p.tags))).slice(0, 20)
        : []

    // Client-side filter post count for pagination — we filter server results
    // by type, budget, tag entirely client-side when we have data
    const filteredPosts = (() => {
        if (!data) return []
        return data.posts.filter(post => {
            if (typeFilter !== 'all') {
                const postType = matchType(post.tags)
                if (postType !== typeFilter) return false
            }
            if (budgetFilter !== 'all') {
                if (!matchBudget(post.budget, budgetFilter)) return false
            }
            if (tagFilter !== null) {
                if (!post.tags.includes(tagFilter)) return false
            }
            return true
        })
    })()

    return (
        <Layout>
            <div className="min-h-screen px-6 py-10">
                <div className="flex gap-10 max-w-7xl mx-auto">

                    {/* ── Left sidebar ── */}
                    <aside className={`flex-shrink-0 space-y-6 ${viewMode === 'grid' ? 'w-0 overflow-hidden' : 'w-56'}`}>

                        {/* Status filter — list mode only */}
                        {viewMode === 'list' && (
                            <div>
                                <h3 className="text-slate-500 font-mono text-[10px] tracking-widest uppercase mb-2">
                                    {lang === 'zh' ? '状态' : 'Status'}
                                </h3>
                                <div className="space-y-1">
                                    {(['all', 'OPEN', 'IN_PROGRESS', 'CLOSED'] as const).map(s => (
                                        <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
                                            className={`w-full text-left px-2 py-1 rounded font-mono text-[11px] border transition-all
                                                ${statusFilter === s
                                                    ? 'border-sky-800 text-sky-400 bg-sky-950/30'
                                                    : 'border-transparent text-slate-600 hover:text-slate-400'}`}>
                                            {s === 'all' ? (lang === 'zh' ? '全部' : 'All')
                                                : STATUS_LABELS[s as MarketStatus][lang]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Programming type filter — list mode only */}
                        {viewMode === 'list' && (
                            <div>
                                <h3 className="text-slate-500 font-mono text-[10px] tracking-widest uppercase mb-2">
                                    {t('market.type')}
                                </h3>
                                <div className="space-y-1">
                                    <button key="all" onClick={() => setTypeFilter('all')}
                                        className={`w-full text-left px-2 py-1 rounded font-mono text-[11px] border transition-all
                                            ${typeFilter === 'all'
                                                ? 'border-sky-800 text-sky-400 bg-sky-950/30'
                                                : 'border-transparent text-slate-600 hover:text-slate-400'}`}>
                                        {t('market.all')}
                                    </button>
                                    {PROGRAMMING_TYPES.map(t => (
                                        <button key={t.key} onClick={() => setTypeFilter(t.key)}
                                            className={`w-full text-left px-2 py-1 rounded font-mono text-[11px] border transition-all
                                                ${typeFilter === t.key
                                                    ? 'border-sky-800 text-sky-400 bg-sky-950/30'
                                                    : 'border-transparent text-slate-600 hover:text-slate-400'}`}>
                                            {lang === 'zh' ? t.zh : t.en}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Budget range filter — list mode only */}
                        {viewMode === 'list' && (
                            <div>
                                <h3 className="text-slate-500 font-mono text-[10px] tracking-widest uppercase mb-2">
                                    {lang === 'zh' ? '酬劳水平' : 'Budget'}
                                </h3>
                                <div className="space-y-1">
                                    <button key="all" onClick={() => setBudgetFilter('all')}
                                        className={`w-full text-left px-2 py-1 rounded font-mono text-[11px] border transition-all
                                            ${budgetFilter === 'all'
                                                ? 'border-sky-800 text-sky-400 bg-sky-950/30'
                                                : 'border-transparent text-slate-600 hover:text-slate-400'}`}>
                                        {t('market.all')}
                                    </button>
                                    {BUDGET_RANGES.map(r => (
                                        <button key={r.key} onClick={() => setBudgetFilter(r.key)}
                                            className={`w-full text-left px-2 py-1 rounded font-mono text-[11px] border transition-all
                                                ${budgetFilter === r.key
                                                    ? 'border-sky-800 text-sky-400 bg-sky-950/30'
                                                    : 'border-transparent text-slate-600 hover:text-slate-400'}`}>
                                            {t(`market.${r.labelKey}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tags filter — list mode only */}
                        {viewMode === 'list' && allTags.length > 0 && (
                            <div>
                                <h3 className="text-slate-500 font-mono text-[10px] tracking-widest uppercase mb-2">
                                    {lang === 'zh' ? '标签' : 'Tags'}
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                    <button onClick={() => setTagFilter(null)}
                                        className={`px-2 py-0.5 rounded border font-mono text-[10px] transition-all
                                            ${tagFilter === null
                                                ? 'border-sky-800 text-sky-400 bg-sky-950/30'
                                                : 'border-slate-800 text-slate-600 hover:text-slate-400'}`}>
                                        {lang === 'zh' ? '全部' : 'All'}
                                    </button>
                                    {allTags.slice(0, 10).map(tag => (
                                        <button key={tag} onClick={() => setTagFilter(prev => prev === tag ? null : tag)}
                                            className={`px-2 py-0.5 rounded border font-mono text-[10px] transition-all
                                                ${tagFilter === tag
                                                    ? 'border-sky-800 text-sky-400 bg-sky-950/30'
                                                    : 'border-slate-800 text-slate-600 hover:text-slate-400'}`}>
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                    </aside>

                    {/* ── Main content ── */}
                    <div className="flex-1 min-w-0">

                        {/* Header + view toggle */}
                        <div className="flex items-center gap-3 mb-6">
                            <h1 className="text-slate-200 font-mono text-base tracking-widest">
                                {t('market.title')}
                            </h1>
                            <div className="flex gap-1 ml-auto">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-1.5 rounded border font-mono text-xs transition-all
                                        ${viewMode === 'list'
                                            ? 'border-sky-700 text-sky-400 bg-sky-950/40'
                                            : 'border-slate-700 text-slate-600 hover:border-slate-600 hover:text-slate-400'}`}>
                                    ☰
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-1.5 rounded border font-mono text-xs transition-all
                                        ${viewMode === 'grid'
                                            ? 'border-sky-700 text-sky-400 bg-sky-950/40'
                                            : 'border-slate-700 text-slate-600 hover:border-slate-600 hover:text-slate-400'}`}>
                                    ⊞
                                </button>
                            </div>
                            {isLoggedIn && (
                                <button onClick={() => setShowPostModal(true)}
                                    className="px-4 py-1.5 rounded border border-sky-800 text-sky-400 font-mono text-xs
                                               hover:border-sky-600 hover:text-sky-300 transition-all">
                                    + {lang === 'zh' ? '发布需求' : 'Post'}
                                </button>
                            )}
                        </div>

                        {/* Search — always present */}
                        <div className="relative mb-4">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm">🔍</span>
                            <input
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1) }}
                                placeholder={lang === 'zh' ? '搜索项目需求...' : 'Search project requests...'}
                                className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded text-slate-200 font-mono text-xs
                                           placeholder:text-slate-600 focus:outline-none focus:border-sky-700 transition-all"
                            />
                        </div>

                        {/* Filter chips row — grid mode */}
                        {viewMode === 'grid' && (
                            <div className="flex flex-wrap gap-2 mb-6 items-center">
                                {/* Status group */}
                                <div className="flex flex-wrap gap-1.5">
                                    <button onClick={() => setStatusFilter('all')}
                                        className={`px-2.5 py-1 rounded border font-mono text-[10px] transition-all
                                            ${statusFilter === 'all'
                                                ? 'border-sky-700 text-sky-400 bg-sky-950/30'
                                                : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}>
                                        {lang === 'zh' ? '全部' : 'All'}
                                    </button>
                                    {(['OPEN', 'IN_PROGRESS', 'CLOSED'] as const).map(s => (
                                        <button key={s} onClick={() => setStatusFilter(s)}
                                            className={`px-2.5 py-1 rounded border font-mono text-[10px] transition-all
                                                ${statusFilter === s
                                                    ? 'border-sky-700 text-sky-400 bg-sky-950/30'
                                                    : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}>
                                            {STATUS_LABELS[s][lang]}
                                        </button>
                                    ))}
                                </div>

                                <div className="w-px h-5 bg-slate-800 flex-shrink-0" />

                                {/* Programming type group */}
                                <div className="flex flex-wrap gap-1.5">
                                    <button onClick={() => setTypeFilter('all')}
                                        className={`px-2.5 py-1 rounded border font-mono text-[10px] transition-all
                                            ${typeFilter === 'all'
                                                ? 'border-sky-700 text-sky-400 bg-sky-950/30'
                                                : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}>
                                        {lang === 'zh' ? '全部类型' : 'All Types'}
                                    </button>
                                    {PROGRAMMING_TYPES.map(t => (
                                        <button key={t.key} onClick={() => setTypeFilter(t.key)}
                                            className={`px-2.5 py-1 rounded border font-mono text-[10px] transition-all
                                                ${typeFilter === t.key
                                                    ? 'border-sky-700 text-sky-400 bg-sky-950/30'
                                                    : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}>
                                            {lang === 'zh' ? t.zh : t.en}
                                        </button>
                                    ))}
                                </div>

                                <div className="w-px h-5 bg-slate-800 flex-shrink-0" />

                                {/* Budget group */}
                                <div className="flex flex-wrap gap-1.5">
                                    <button onClick={() => setBudgetFilter('all')}
                                        className={`px-2.5 py-1 rounded border font-mono text-[10px] transition-all
                                            ${budgetFilter === 'all'
                                                ? 'border-sky-700 text-sky-400 bg-sky-950/30'
                                                : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}>
                                        {lang === 'zh' ? '全部预算' : 'All Budgets'}
                                    </button>
                                    {BUDGET_RANGES.map(r => (
                                        <button key={r.key} onClick={() => setBudgetFilter(r.key)}
                                            className={`px-2.5 py-1 rounded border font-mono text-[10px] transition-all
                                                ${budgetFilter === r.key
                                                    ? 'border-sky-700 text-sky-400 bg-sky-950/30'
                                                    : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}>
                                            {t(`market.${r.labelKey}`)}
                                        </button>
                                    ))}
                                </div>

                                {allTags.length > 0 && (
                                    <>
                                        <div className="w-px h-5 bg-slate-800 flex-shrink-0" />
                                        {/* Tags group */}
                                        <div className="flex flex-wrap gap-1.5">
                                            <button onClick={() => setTagFilter(null)}
                                                className={`px-2.5 py-1 rounded border font-mono text-[10px] transition-all
                                                    ${tagFilter === null
                                                        ? 'border-sky-700 text-sky-400 bg-sky-950/30'
                                                        : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}>
                                                {lang === 'zh' ? '全部标签' : 'All Tags'}
                                            </button>
                                            {allTags.slice(0, 10).map(tag => (
                                                <button key={tag} onClick={() => setTagFilter(prev => prev === tag ? null : tag)}
                                                    className={`px-2.5 py-1 rounded border font-mono text-[10px] transition-all
                                                        ${tagFilter === tag
                                                            ? 'border-sky-700 text-sky-400 bg-sky-950/30'
                                                            : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}>
                                                    #{tag}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Loading skeleton */}
                        {loading && (
                            <div className="space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    viewMode === 'list'
                                        ? <div key={i} className="h-12 rounded-lg bg-slate-900/40 border border-slate-800 animate-pulse" />
                                        : <div key={i} className="p-5 rounded-lg bg-slate-900/40 border border-slate-800 animate-pulse">
                                            <div className="h-4 bg-slate-800 rounded w-1/3 mb-2" />
                                            <div className="h-3 bg-slate-800 rounded w-full mb-2" />
                                            <div className="h-3 bg-slate-800 rounded w-2/3" />
                                          </div>
                                ))}
                            </div>
                        )}

                        {/* Empty */}
                        {!loading && filteredPosts.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-32 gap-4">
                                <div className="text-slate-700 text-5xl">◈</div>
                                <p className="text-slate-600 font-mono text-sm">
                                    {debouncedSearch || typeFilter !== 'all' || budgetFilter !== 'all' || tagFilter
                                        ? (lang === 'zh' ? '没有找到匹配的项目' : 'No matching projects found')
                                        : (lang === 'zh' ? '暂无需求' : 'No requests yet')
                                    }
                                </p>
                            </div>
                        )}

                        {/* List view */}
                        {!loading && filteredPosts.length > 0 && viewMode === 'list' && (
                            <div className="space-y-2">
                                {filteredPosts.map(post => (
                                    <div
                                        key={post.id}
                                        onClick={() => {
                                            if (!isLoggedIn) {
                                                showToast(t('market.notLoggedIn'))
                                            } else {
                                                setDetailPost(post)
                                            }
                                        }}
                                        className="flex items-center gap-4 px-4 py-3 rounded-lg bg-slate-900/40 border border-slate-800
                                                   hover:border-sky-800/60 transition-all group cursor-pointer">
                                        <span className={`flex-shrink-0 px-2 py-0.5 rounded border font-mono text-[10px] ${STATUS_COLORS[post.status]}`}>
                                            {STATUS_LABELS[post.status][lang]}
                                        </span>
                                        <h3 className="text-slate-200 font-medium text-sm line-clamp-1 flex-1 group-hover:text-sky-300 transition-colors">
                                            {post.title}
                                        </h3>
                                        {post.budget !== null && (
                                            <span className="text-sky-400 font-mono text-xs flex-shrink-0">
                                                ¥{post.budget.toLocaleString()}
                                            </span>
                                        )}
                                        {post.timeline && (
                                            <span className="text-slate-700 font-mono text-[10px] flex-shrink-0">
                                                ⏱ {post.timeline}
                                            </span>
                                        )}
                                        {post.tags.slice(0, 2).map(tag => (
                                            <span key={tag} className="text-slate-700 font-mono text-[10px] flex-shrink-0">
                                                #{tag}
                                            </span>
                                        ))}
                                        <span className="text-slate-700 font-mono text-[10px] flex-shrink-0">
                                            {new Date(post.createdAt).toLocaleDateString(
                                                lang === 'zh' ? 'zh-CN' : 'en-US',
                                                { month: 'short', day: 'numeric' }
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Grid view */}
                        {!loading && filteredPosts.length > 0 && viewMode === 'grid' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {filteredPosts.map(post => (
                                    <div
                                        key={post.id}
                                        onClick={() => {
                                            if (!isLoggedIn) {
                                                showToast(t('market.notLoggedIn'))
                                            } else {
                                                setDetailPost(post)
                                            }
                                        }}
                                        className="p-5 rounded-lg bg-slate-900/40 border border-slate-800
                                                   hover:border-sky-800/60 transition-all duration-300 group cursor-pointer">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <h3 className="text-slate-200 font-medium text-sm group-hover:text-sky-300 transition-colors line-clamp-1 flex-1">
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
                                                <span className="text-sky-400 font-mono text-xs">
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
                                                {new Date(post.createdAt).toLocaleDateString(
                                                    lang === 'zh' ? 'zh-CN' : 'en-US',
                                                    { year: 'numeric', month: 'short', day: 'numeric' }
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && data && data.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-10">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="px-4 py-1.5 rounded border border-slate-700 text-slate-500 font-mono text-xs
                                               hover:border-sky-700 hover:text-sky-400 transition-all
                                               disabled:opacity-30 disabled:cursor-not-allowed">
                                    ←
                                </button>
                                <span className="text-slate-600 font-mono text-xs">{page} / {data.totalPages}</span>
                                <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                                    disabled={page >= data.totalPages}
                                    className="px-4 py-1.5 rounded border border-slate-700 text-slate-500 font-mono text-xs
                                               hover:border-sky-700 hover:text-sky-400 transition-all
                                               disabled:opacity-30 disabled:cursor-not-allowed">
                                    →
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Post creation modal */}
            {showPostModal && (
                <MarketPostModal
                    lang={lang}
                    onClose={() => setShowPostModal(false)}
                    onCreate={handleCreate}
                />
            )}

            {/* MarketPost detail modal */}
            {detailPost && (
                <MarketPostDetailModal
                    post={detailPost}
                    lang={lang}
                    onClose={() => setDetailPost(null)}
                    onToast={showToast}
                />
            )}

            <Toast message={toast.message} visible={toast.visible} />
        </Layout>
    )
}

// ─────────────────────────────────────────────
// MarketPostModal
// ─────────────────────────────────────────────
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
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-700 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '需求描述 *' : 'Description *'}</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} required
                            placeholder={lang === 'zh' ? '详细描述你的需求...' : 'Describe your project in detail...'}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono resize-none focus:outline-none focus:border-sky-700 transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '预算（元）' : 'Budget (¥)'}</label>
                            <input value={budget} onChange={e => setBudget(e.target.value)} type="number"
                                placeholder="5000"
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-700 transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '预计时间' : 'Timeline'}</label>
                            <input value={timeline} onChange={e => setTimeline(e.target.value)}
                                placeholder={lang === 'zh' ? '2周' : '2 weeks'}
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-700 transition-all" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '标签（逗号分隔）' : 'Tags (comma-separated)'}</label>
                        <input value={tags} onChange={e => setTags(e.target.value)}
                            placeholder={lang === 'zh' ? 'AI, 前端, React' : 'AI, Frontend, React'}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-700 transition-all" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2 border border-slate-700 text-slate-500 font-mono text-xs rounded hover:border-slate-600 transition-all">
                            {lang === 'zh' ? '取消' : 'Cancel'}
                        </button>
                        <button type="submit" disabled={submitting}
                            className="flex-1 py-2 bg-sky-950/40 border border-sky-800 text-sky-400 font-mono text-xs rounded hover:border-sky-600 transition-all disabled:opacity-40">
                            {submitting ? (lang === 'zh' ? '发布中...' : 'Posting...') : (lang === 'zh' ? '发布' : 'Post')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// MarketPostDetailModal
// ─────────────────────────────────────────────
function MarketPostDetailModal({
    post, lang, onClose, onToast,
}: {
    post: MarketPost
    lang: 'zh' | 'en'
    onClose: () => void
    onToast: (msg: string) => void
}) {
    const [posterName, setPosterName] = useState<string | null>(null)

    useEffect(() => {
        if (post.posterId) {
            fetch(`/api/users/${post.posterId}`)
                .then(r => r.ok ? r.json() : null)
                .then(user => {
                    if (user) setPosterName(user.name || user.email || '—')
                })
                .catch(() => {})
        }
    }, [post.posterId])

    const handleCopyEmail = () => {
        if (!post.contactEmail) return
        navigator.clipboard.writeText(post.contactEmail).then(() => {
            onToast(lang === 'zh' ? '邮箱已复制' : 'Email copied')
        }).catch(() => {
            onToast(lang === 'zh' ? '邮箱已复制' : 'Email copied')
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div onClick={e => e.stopPropagation()}
                className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                    <span className={`px-2 py-0.5 rounded border font-mono text-[10px] ${STATUS_COLORS[post.status]}`}>
                        {STATUS_LABELS[post.status][lang]}
                    </span>
                    <button onClick={onClose}
                        className="text-slate-600 hover:text-slate-300 font-mono text-sm transition-colors">✕</button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Title */}
                    <h2 className="text-slate-200 font-medium text-base leading-snug">
                        {post.title}
                    </h2>

                    {/* Meta row */}
                    <div className="flex items-center gap-4">
                        {post.budget !== null && (
                            <span className="text-sky-400 font-mono text-sm font-medium">
                                ¥{post.budget.toLocaleString()}
                            </span>
                        )}
                        {post.timeline && (
                            <span className="text-slate-600 font-mono text-xs">
                                ⏱ {post.timeline}
                            </span>
                        )}
                        <span className="text-slate-700 font-mono text-[10px] ml-auto">
                            {new Date(post.createdAt).toLocaleDateString(
                                lang === 'zh' ? 'zh-CN' : 'en-US',
                                { year: 'numeric', month: 'long', day: 'numeric' }
                            )}
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-slate-400 text-sm leading-relaxed">
                        {post.description}
                    </p>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {post.tags.map(tag => (
                                <span key={tag}
                                    className="px-2 py-0.5 rounded border border-slate-800 text-slate-600 font-mono text-[11px]">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Contact info */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                        {posterName && (
                            <div className="flex items-center gap-2">
                                <span className="text-slate-600 font-mono text-[10px]">
                                    {lang === 'zh' ? '发布者' : 'Posted by'}:
                                </span>
                                <span className="text-slate-400 font-mono text-xs">{posterName}</span>
                            </div>
                        )}
                        {post.contactEmail && (
                            <div className="flex items-center gap-2">
                                <span className="text-slate-600 font-mono text-[10px]">
                                    {lang === 'zh' ? '联系方式' : 'Contact'}:
                                </span>
                                <span className="text-slate-400 font-mono text-xs">{post.contactEmail}</span>
                                <button
                                    onClick={handleCopyEmail}
                                    className="ml-2 px-2 py-0.5 rounded border border-sky-800 text-sky-400 font-mono text-[10px]
                                               hover:border-sky-600 hover:text-sky-300 transition-all">
                                    {lang === 'zh' ? '复制邮箱' : 'Copy Email'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-800">
                    <button onClick={onClose}
                        className="w-full py-2 border border-slate-700 text-slate-500 font-mono text-xs rounded
                                   hover:border-slate-600 hover:text-slate-300 transition-all">
                        {lang === 'zh' ? '关闭' : 'Close'}
                    </button>
                </div>

            </div>
        </div>
    )
}
