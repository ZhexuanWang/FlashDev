import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ForumPost } from '../types/forum'
import { Layout } from '../components/Layout'
import { useAuthStore } from '../store/authStore'

const LIMIT = 20

export default function ForumPage() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const navigate = useNavigate()
    const { token } = useAuthStore()
    const isLoggedIn = !!token

    const [data, setData] = useState<{ posts: ForumPost[]; total: number; totalPages: number } | null>(null)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [showModal, setShowModal] = useState(false)

    const fetchPosts = (pg: number) => {
        setLoading(true)
        fetch(`/api/forum?page=${pg}&limit=${LIMIT}`)
            .then(r => r.json())
            .then(d => setData(d))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchPosts(page) }, [page])

    const handleCreate = async (body: { title: string; content: string; tags?: string[] }) => {
        if (!token) return
        const res = await fetch('/api/forum', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title: body.title, content: body.content, tags: body.tags }),
        })
        if (res.ok) {
            setShowModal(false)
            fetchPosts(1)
        }
    }

    const handleUpvote = async (postId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!token) { alert(lang === 'zh' ? '请先登录' : 'Please login first'); return }
        const res = await fetch(`/api/forum/${postId}/upvote`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
            setData(prev => prev ? {
                ...prev,
                posts: prev.posts.map(p => p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p),
            } : prev)
        }
    }

    const allTags = data ? Array.from(new Set(data.posts.flatMap(p => p.tags))) : []

    return (
        <Layout>
            <div className="max-w-5xl mx-auto px-6 py-10">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-slate-200 font-mono text-base tracking-widest">
                        {t('forum.title')}
                    </h1>
                    {isLoggedIn ? (
                        <button onClick={() => setShowModal(true)}
                            className="px-4 py-2 rounded border border-amber-900 text-amber-400 font-mono text-xs
                                       hover:border-amber-600 hover:text-amber-300 transition-all">
                            + {lang === 'zh' ? '发布主题' : 'New Topic'}
                        </button>
                    ) : (
                        <span className="text-slate-700 font-mono text-xs">
                            {lang === 'zh' ? '登录后参与讨论' : 'Login to join the discussion'}
                        </span>
                    )}
                </div>

                {/* Not logged in banner */}
                {!isLoggedIn && (
                    <div className="mb-6 p-4 rounded-lg border border-amber-900/40 bg-amber-950/20 flex items-center gap-4">
                        <span className="text-2xl">💬</span>
                        <div>
                            <p className="text-amber-400 font-mono text-xs">
                                {lang === 'zh' ? '登录后可以发表主题、参与讨论和点赞' : 'Login to post topics, join discussions, and upvote'}
                            </p>
                        </div>
                        <button onClick={() => navigate('/login')}
                            className="ml-auto px-3 py-1.5 rounded border border-amber-800 text-amber-500 font-mono text-xs hover:border-amber-600 transition-all">
                            {lang === 'zh' ? '登录' : 'Login'}
                        </button>
                    </div>
                )}

                {/* Tag filter */}
                {allTags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-6">
                        <button onClick={() => {}}
                            className="px-3 py-1 rounded font-mono text-xs border border-slate-800 text-slate-600 hover:border-slate-600 transition-all">
                            {lang === 'zh' ? '全部' : 'All'}
                        </button>
                        {allTags.map(tag => (
                            <button key={tag}
                                className="px-3 py-1 rounded font-mono text-xs border border-slate-800 text-slate-600 hover:border-amber-800 hover:text-amber-500 transition-all">
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
                {!loading && (!data || data.posts.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="text-slate-700 text-5xl">◈</div>
                        <p className="text-slate-600 font-mono text-sm">
                            {lang === 'zh' ? '暂无话题' : 'No topics yet'}
                        </p>
                    </div>
                )}

                {/* Posts */}
                {!loading && data && data.posts.length > 0 && (
                    <div className="space-y-3">
                        {data.posts.map(post => (
                            <ForumCard
                                key={post.id}
                                post={post}
                                lang={lang}
                                isLoggedIn={isLoggedIn}
                                onUpvote={(e) => handleUpvote(post.id, e)}
                                onClick={() => navigate(`/forum/${post.id}`)}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && data && data.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-10">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-4 py-1.5 rounded border border-slate-700 text-slate-500 font-mono text-xs
                                       hover:border-amber-700 hover:text-amber-400 transition-all disabled:opacity-30">
                            ←
                        </button>
                        <span className="text-slate-600 font-mono text-xs">{page} / {data.totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                            disabled={page >= data.totalPages}
                            className="px-4 py-1.5 rounded border border-slate-700 text-slate-500 font-mono text-xs
                                       hover:border-amber-700 hover:text-amber-400 transition-all disabled:opacity-30">
                            →
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <NewTopicModal lang={lang} onClose={() => setShowModal(false)} onCreate={handleCreate} />
            )}
        </Layout>
    )
}

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
            {/* Upvote */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <button onClick={onUpvote}
                    className={`text-lg transition-colors ${isLoggedIn ? 'hover:text-amber-400' : 'cursor-default'}
                        ${isLoggedIn ? '' : 'opacity-50'}`}>
                    ▲
                </button>
                <span className="text-amber-400 font-mono text-xs">{post.upvotes}</span>
            </div>

            {/* Content */}
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

function NewTopicModal({
    lang, onClose, onCreate,
}: {
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
                title,
                content,
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
                        {lang === 'zh' ? '发布新话题' : 'New Topic'}
                    </h2>
                    <button onClick={onClose}
                        className="text-slate-600 hover:text-slate-300 font-mono text-sm transition-colors">✕</button>
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
                        <label className="text-slate-500 font-mono text-[10px]">{lang === 'zh' ? '标签（逗号分隔）' : 'Tags (comma-separated)'}</label>
                        <input value={tags} onChange={e => setTags(e.target.value)}
                            placeholder={lang === 'zh' ? 'AI, Vibe Coding, 工具' : 'AI, Vibe Coding, Tools'}
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
