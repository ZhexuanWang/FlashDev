import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ForumPostWithComments } from '../types/forum'
import { Layout } from '../components/Layout'
import { useAuthStore } from '../store/authStore'

export default function ForumDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const navigate = useNavigate()
    const { token } = useAuthStore()
    const isLoggedIn = !!token

    const [post,     setPost]     = useState<ForumPostWithComments | null>(null)
    const [loading,  setLoading]  = useState(true)
    const [comment,  setComment]  = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!id) return
        fetch(`/api/forum/posts/${id}`)
            .then(r => r.json())
            .then((d: ForumPostWithComments) => setPost(d))
            .finally(() => setLoading(false))
    }, [id])

    const handleUpvote = async () => {
        if (!token || !id) return
        await fetch(`/api/forum/posts/${id}/upvote`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        })
        setPost(prev => prev ? { ...prev, upvotes: prev.upvotes + 1 } : prev)
    }

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token || !id || !comment.trim()) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/forum/posts/${id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content: comment }),
            })
            if (res.ok) {
                const newComment = await res.json()
                setPost(prev => prev ? { ...prev, comments: [...prev.comments, newComment] } : prev)
                setComment('')
            }
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#000508] flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
            </div>
        )
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#000508] flex flex-col items-center justify-center gap-4">
                <p className="text-slate-600 font-mono text-sm">{lang === 'zh' ? '话题未找到' : 'Topic not found'}</p>
                <button onClick={() => navigate('/forum')} className="text-sky-600 font-mono text-xs">
                    {lang === 'zh' ? '返回论坛' : 'Back to Forum'}
                </button>
            </div>
        )
    }

    const date = new Date(post.createdAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    })

    return (
        <Layout backPath="/forum">
            <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

                {/* Post */}
                <div className="p-6 rounded-lg bg-slate-900/40 border border-slate-800">
                    <h1 className="text-slate-100 font-semibold text-xl mb-3">{post.title}</h1>
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-slate-600 font-mono text-xs">
                            {post.author?.email ?? (lang === 'zh' ? '匿名用户' : 'Anonymous')}
                        </span>
                        <span className="text-slate-700 font-mono text-xs">{date}</span>
                    </div>
                    <div className="text-slate-400 text-sm leading-relaxed font-mono whitespace-pre-wrap mb-4">
                        {typeof post.content === 'string' ? post.content : JSON.stringify(post.content, null, 2)}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                            {post.tags.map(tag => (
                                <span key={tag}
                                    className="text-slate-700 font-mono text-[10px] border border-slate-800 rounded px-2 py-0.5">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        <button onClick={handleUpvote}
                            disabled={!isLoggedIn}
                            className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded border font-mono text-xs transition-all
                                ${isLoggedIn
                                    ? 'border-amber-800 text-amber-400 hover:bg-amber-950/30 hover:border-amber-600'
                                    : 'border-slate-800 text-slate-700 cursor-not-allowed opacity-50'}`}>
                            ▲ {post.upvotes}
                        </button>
                    </div>
                </div>

                {/* Comments */}
                <div className="space-y-4">
                    <h2 className="text-slate-500 font-mono text-xs tracking-widest">
                        {lang === 'zh' ? `评论（${post.comments.length}）` : `Comments (${post.comments.length})`}
                    </h2>

                    {/* Comment list */}
                    {post.comments.length === 0 && (
                        <p className="text-slate-700 font-mono text-xs py-4 text-center">
                            {lang === 'zh' ? '暂无评论' : 'No comments yet'}
                        </p>
                    )}

                    {post.comments.map(c => {
                        const cDate = new Date(c.createdAt).toLocaleDateString(
                            lang === 'zh' ? 'zh-CN' : 'en-US',
                            { month: 'short', day: 'numeric' },
                        )
                        return (
                            <div key={c.id}
                                className="p-4 rounded-lg bg-slate-900/20 border border-slate-800/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-slate-600 font-mono text-[10px]">
                                        {c.author?.email ?? (lang === 'zh' ? '匿名' : 'Anonymous')}
                                    </span>
                                    <span className="text-slate-700 font-mono text-[10px]">{cDate}</span>
                                </div>
                                <p className="text-slate-400 text-xs font-mono leading-relaxed">{c.content}</p>
                            </div>
                        )
                    })}

                    {/* Comment form */}
                    {isLoggedIn ? (
                        <form onSubmit={handleComment} className="space-y-2">
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                rows={3}
                                required
                                placeholder={lang === 'zh' ? '写下你的评论...' : 'Write your comment...'}
                                className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-200 font-mono text-xs resize-none focus:outline-none focus:border-amber-700 transition-all"
                            />
                            <button type="submit" disabled={submitting || !comment.trim()}
                                className="px-4 py-2 rounded border border-amber-800 text-amber-400 font-mono text-xs hover:border-amber-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                {submitting
                                    ? (lang === 'zh' ? '发送中...' : 'Posting...')
                                    : (lang === 'zh' ? '发送评论' : 'Post Comment')
                                }
                            </button>
                        </form>
                    ) : (
                        <div className="p-4 rounded-lg border border-amber-900/40 bg-amber-950/20 text-center">
                            <p className="text-amber-400 font-mono text-xs">
                                {lang === 'zh' ? '登录后参与讨论' : 'Login to join the discussion'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}
