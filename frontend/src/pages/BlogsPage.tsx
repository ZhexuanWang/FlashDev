import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { BlogPost, PaginatedPosts } from '../types/blog'
import { Layout } from '../components/Layout'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../store/authStore'

const LIMIT = 6

export default function BlogsPage() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const navigate = useNavigate()

    const { token } = useEditorStore()
    const { role } = useAuthStore()
    const canEdit = !!(token && (role === 'COMPANY' || role === 'ADMIN'))

    const [data, setData] = useState<PaginatedPosts | null>(null)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [activeTag, setActiveTag] = useState<string | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)

    const fetchPosts = (pg: number, tag?: string | null) => {
        setLoading(true)
        const params = new URLSearchParams({ page: String(pg), limit: String(LIMIT) })
        if (tag) params.set('tag', tag)
        fetch(`/api/blogs?${params}`)
            .then(r => r.json())
            .then((d: PaginatedPosts) => setData(d))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchPosts(page, activeTag)
    }, [page, activeTag])

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm(lang === 'zh' ? '确认删除此文章？' : 'Delete this post?')) return
        setDeleting(id)
        try {
            const res = await fetch(`/api/blogs/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                fetchPosts(page, activeTag)
            }
        } finally {
            setDeleting(null)
        }
    }

    const handleCreate = async (data: {
        titleZh: string; titleEn: string
        excerptZh: string; excerptEn: string
        tags: string; isPublished: boolean
    }) => {
        const res = await fetch('/api/blogs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                titleZh:    data.titleZh,
                titleEn:    data.titleEn,
                excerptZh:  data.excerptZh,
                excerptEn:  data.excerptEn,
                tags:       data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                isPublished: data.isPublished,
            }),
        })
        if (res.ok) {
            const newPost: BlogPost = await res.json()
            setShowModal(false)
            navigate(`/blogs/${newPost.id}`)
        }
    }

    // Collect all tags from current page
    const allTags = data
        ? Array.from(new Set(data.posts.flatMap(p => p.tags)))
        : []

    return (
        <Layout>
            <div className="max-w-6xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-slate-200 font-mono text-base tracking-widest">
                        {t('blogs.title')}
                    </h1>
                    {canEdit && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 rounded border border-sky-800 text-sky-400 font-mono text-xs
                                       hover:border-sky-500 hover:text-sky-300 transition-all"
                        >
                            + {lang === 'zh' ? '新建文章' : 'New Post'}
                        </button>
                    )}
                </div>

                <div className="flex gap-10">
                    {/* Main content */}
                    <div className="flex-1 min-w-0">

                        {/* Tag filter chips */}
                        {allTags.length > 0 && (
                            <div className="flex gap-2 flex-wrap mb-8">
                                <button
                                    onClick={() => { setActiveTag(null); setPage(1) }}
                                    className={`px-3 py-1 rounded font-mono text-xs border transition-all
                                        ${!activeTag
                                            ? 'bg-sky-900/40 border-sky-600 text-sky-300'
                                            : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                >
                                    {lang === 'zh' ? '全部' : 'All'}
                                </button>
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => { setActiveTag(tag); setPage(1) }}
                                        className={`px-3 py-1 rounded font-mono text-xs border transition-all
                                            ${activeTag === tag
                                                ? 'bg-sky-900/40 border-sky-600 text-sky-300'
                                                : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Loading */}
                        {loading && (
                            <div className="space-y-6">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-lg bg-slate-900/40 border border-slate-800 animate-pulse">
                                        <div className="w-24 h-24 bg-slate-800 rounded" />
                                        <div className="flex-1 space-y-2 pt-2">
                                            <div className="h-5 bg-slate-800 rounded w-1/2" />
                                            <div className="h-3 bg-slate-800 rounded w-full" />
                                            <div className="h-3 bg-slate-800 rounded w-3/4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty */}
                        {!loading && (!data || data.posts.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-32 gap-4">
                                <div className="text-slate-700 text-5xl">◈</div>
                                <p className="text-slate-600 font-mono text-sm">
                                    {activeTag
                                        ? (lang === 'zh' ? '暂无相关文章' : 'No posts found')
                                        : (lang === 'zh' ? '暂无文章' : 'No posts yet')
                                    }
                                </p>
                                {activeTag && (
                                    <button
                                        onClick={() => setActiveTag(null)}
                                        className="text-sky-700 hover:text-sky-500 font-mono text-xs transition-colors"
                                    >
                                        {lang === 'zh' ? '清除标签筛选' : 'Clear tag filter'}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Posts */}
                        {!loading && data && data.posts.length > 0 && (
                            <div className="space-y-6">
                                {data.posts.map(post => (
                                    <BlogCard
                                        key={post.id}
                                        post={post}
                                        lang={lang}
                                        canEdit={canEdit}
                                        deleting={deleting === post.id}
                                        onClick={() => navigate(`/blogs/${post.id}`)}
                                        onDelete={(e) => handleDelete(post.id, e)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && data && data.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-10">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="px-4 py-1.5 rounded border border-slate-700 text-slate-500 font-mono text-xs
                                               hover:border-sky-700 hover:text-sky-400 transition-all
                                               disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    ←
                                </button>
                                <span className="text-slate-600 font-mono text-xs">
                                    {page} / {data.totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                                    disabled={page >= data.totalPages}
                                    className="px-4 py-1.5 rounded border border-slate-700 text-slate-500 font-mono text-xs
                                               hover:border-sky-700 hover:text-sky-400 transition-all
                                               disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    →
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="w-56 flex-shrink-0 space-y-8">
                        {/* Tag cloud */}
                        {allTags.length > 0 && (
                            <div>
                                <h3 className="text-slate-500 font-mono text-[10px] tracking-widest uppercase mb-3">
                                    {lang === 'zh' ? '标签' : 'Tags'}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {allTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => { setActiveTag(tag); setPage(1) }}
                                            className={`px-2 py-1 rounded font-mono text-[10px] border transition-all
                                                ${activeTag === tag
                                                    ? 'bg-sky-900/40 border-sky-600 text-sky-300'
                                                    : 'border-slate-800 text-slate-600 hover:border-slate-600 hover:text-slate-400'}`}
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* About */}
                        <div>
                            <h3 className="text-slate-500 font-mono text-[10px] tracking-widest uppercase mb-3">
                                {lang === 'zh' ? '关于博客' : 'About Blog'}
                            </h3>
                            <p className="text-slate-600 font-mono text-xs leading-relaxed">
                                {lang === 'zh'
                                    ? '分享 Vibe Coding 前沿资讯、项目实操与行业洞察。'
                                    : 'Sharing cutting-edge Vibe Coding insights, project practices, and industry trends.'
                                }
                            </p>
                        </div>
                    </aside>
                </div>
            </div>

            {showModal && (
                <NewBlogModal
                    lang={lang}
                    onClose={() => setShowModal(false)}
                    onCreate={handleCreate}
                />
            )}
        </Layout>
    )
}

function BlogCard({
    post, lang, canEdit, deleting, onClick, onDelete,
}: {
    post: BlogPost
    lang: 'zh' | 'en'
    canEdit: boolean
    deleting: boolean
    onClick: () => void
    onDelete: (e: React.MouseEvent) => void
}) {
    const date = new Date(post.createdAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    })

    return (
        <div
            onClick={onClick}
            className="flex gap-5 p-4 rounded-lg bg-slate-900/40 border border-slate-800
                       cursor-pointer hover:border-sky-800 transition-all duration-300 group"
        >
            {/* Cover */}
            {post.coverImage ? (
                <img
                    src={post.coverImage}
                    alt="cover"
                    className="w-28 h-20 object-cover rounded flex-shrink-0"
                />
            ) : (
                <div className="w-28 h-20 bg-slate-800 rounded flex-shrink-0 flex items-center justify-center text-slate-700 text-2xl">
                    ◈
                </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-slate-200 font-medium text-sm line-clamp-1 group-hover:text-sky-300 transition-colors">
                        {post.title[lang] || post.title.zh}
                    </h3>
                    {canEdit && (
                        <button
                            onClick={onDelete}
                            disabled={deleting}
                            className="flex-shrink-0 w-6 h-6 rounded bg-black/50 border border-red-900
                                       text-red-400 font-mono text-[10px]
                                       hover:bg-red-900/60 opacity-0 group-hover:opacity-100 transition-all
                                       disabled:opacity-50"
                        >
                            {deleting ? '...' : '✕'}
                        </button>
                    )}
                </div>

                <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                    {post.excerpt[lang] || post.excerpt.zh}
                </p>

                <div className="flex items-center gap-3">
                    {post.tags.slice(0, 3).map(tag => (
                        <span key={tag}
                            className="text-slate-700 font-mono text-[10px] border border-slate-800 rounded px-1.5 py-0.5">
                            #{tag}
                        </span>
                    ))}
                    <span className="ml-auto text-slate-700 font-mono text-[10px]">
                        {date}
                    </span>
                </div>
            </div>
        </div>
    )
}

function NewBlogModal({
    lang, onClose, onCreate,
}: {
    lang: 'zh' | 'en'
    onClose: () => void
    onCreate: (data: {
        titleZh: string; titleEn: string
        excerptZh: string; excerptEn: string
        tags: string; isPublished: boolean
    }) => void
}) {
    const [titleZh, setTitleZh] = useState('')
    const [titleEn, setTitleEn] = useState('')
    const [excerptZh, setExcerptZh] = useState('')
    const [excerptEn, setExcerptEn] = useState('')
    const [tags, setTags] = useState('')
    const [isPublished, setIsPublished] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await onCreate({ titleZh, titleEn, excerptZh, excerptEn, tags, isPublished })
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
                        {lang === 'zh' ? '新建文章' : 'New Blog Post'}
                    </h2>
                    <button onClick={onClose}
                        className="text-slate-600 hover:text-slate-300 font-mono text-sm transition-colors">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                            {lang === 'zh' ? '标题（中）*' : 'Title (ZH) *'}
                        </label>
                        <input value={titleZh} onChange={e => setTitleZh(e.target.value)} required
                            placeholder={lang === 'zh' ? '中文标题' : 'Chinese title'}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-sky-700 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                            {lang === 'zh' ? '标题（英）' : 'Title (EN)'}
                        </label>
                        <input value={titleEn} onChange={e => setTitleEn(e.target.value)}
                            placeholder={lang === 'zh' ? '英文标题（选填）' : 'English title (optional)'}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-sky-700 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                            {lang === 'zh' ? '摘要（中）*' : 'Excerpt (ZH) *'}
                        </label>
                        <textarea value={excerptZh} onChange={e => setExcerptZh(e.target.value)} rows={3} required
                            placeholder={lang === 'zh' ? '中文摘要' : 'Chinese excerpt'}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono placeholder:text-slate-600 resize-none focus:outline-none focus:border-sky-700 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                            {lang === 'zh' ? '摘要（英）' : 'Excerpt (EN)'}
                        </label>
                        <textarea value={excerptEn} onChange={e => setExcerptEn(e.target.value)} rows={3}
                            placeholder={lang === 'zh' ? '英文摘要（选填）' : 'English excerpt (optional)'}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono placeholder:text-slate-600 resize-none focus:outline-none focus:border-sky-700 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                            {lang === 'zh' ? '标签（逗号分隔）' : 'Tags (comma-separated)'}
                        </label>
                        <input value={tags} onChange={e => setTags(e.target.value)}
                            placeholder={lang === 'zh' ? 'vibe-coding, AI, React' : 'vibe-coding, AI, React'}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2 text-slate-200 text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-sky-700 transition-all" />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div onClick={() => setIsPublished(v => !v)}
                            className={`w-8 h-4 rounded-full relative transition-all ${isPublished ? 'bg-sky-600' : 'bg-slate-700'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isPublished ? 'left-4' : 'left-0.5'}`} />
                        </div>
                        <span className="text-slate-400 font-mono text-xs">
                            {lang === 'zh' ? '发布文章' : 'Publish post'}
                        </span>
                    </label>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2 border border-slate-700 text-slate-500 font-mono text-xs rounded hover:border-slate-600 hover:text-slate-300 transition-all">
                            {lang === 'zh' ? '取消' : 'Cancel'}
                        </button>
                        <button type="submit" disabled={submitting}
                            className="flex-1 py-2 bg-sky-900/40 border border-sky-700 text-sky-400 font-mono text-xs rounded hover:bg-sky-800/40 hover:border-sky-500 hover:text-sky-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            {submitting ? (lang === 'zh' ? '创建中...' : 'Creating...') : (lang === 'zh' ? '创建' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
