import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { BlogPost } from '../types/blog'
import type { ProjectBlock } from '../types/block'
import { Layout } from '../components/Layout'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../store/authStore'
import { BlockEditor } from '../components/editor/BlockEditor/BlockEditor'
import { EditableText } from '../components/editor/EditableText'

export default function BlogDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'

    const authToken = useAuthStore(s => s.token)
    const editorToken = useEditorStore(s => s.token)
    const role = useAuthStore(s => s.role)
    const token = useEditorStore(s => s.token)
    const isEditing = !!(token && (role === 'COMPANY' || role === 'ADMIN'))

    const [post, setPost] = useState<BlogPost | null>(null)
    const [blocks, setBlocks] = useState<ProjectBlock[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        Promise.all([
            fetch(`/api/blogs/${id}`).then(r => r.json()),
            fetch(`/api/blogs/${id}/blocks`).then(r => r.json()),
        ]).then(([p, b]) => {
            setPost(p)
            setBlocks(Array.isArray(b) ? b : [])
        }).finally(() => setLoading(false))
    }, [id])

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
                <p className="text-slate-600 font-mono text-sm">{t('blogs.notFound')}</p>
                <button onClick={() => navigate('/blogs')} className="text-sky-600 font-mono text-xs">
                    {t('common.back')}
                </button>
            </div>
        )
    }

    const saveTitle = async (newTitle: string) => {
        if (!authToken || !id) return
        const res = await fetch(`/api/blogs/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ titleZh: newTitle, titleEn: newTitle }),
        })
        if (res.ok) setPost(JSON.parse(await res.text()))
    }

    const uploadOrReplaceCover = async (files: FileList | null) => {
        if (!files?.length) return
        const uploadToken = authToken ?? editorToken
        if (!uploadToken || !id) return
        const formData = new FormData()
        formData.append('file', files[0])
        const res = await fetch('/api/blogs/upload/cover', {
            method: 'POST',
            headers: { Authorization: `Bearer ${uploadToken}` },
            body: formData,
        })
        if (!res.ok) return
        const { url } = await res.json()
        const res2 = await fetch(`/api/blogs/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${uploadToken}` },
            body: JSON.stringify({ coverImage: url }),
        })
        if (res2.ok) setPost(JSON.parse(await res2.text()))
    }

    const deleteCover = async () => {
        const removeToken = authToken ?? editorToken
        if (!removeToken || !id) return
        const res = await fetch(`/api/blogs/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${removeToken}` },
            body: JSON.stringify({ coverImage: null }),
        })
        if (res.ok) setPost(JSON.parse(await res.text()))
    }

    const date = new Date(post.createdAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    })

    return (
        <Layout backPath="/blogs">
            <div className="w-[90vw] max-w-4xl mx-auto px-6 py-10 space-y-8">

                {/* Cover */}
                <div className="relative w-full aspect-[3/1] bg-slate-900 rounded-lg overflow-hidden">
                    {post.coverImage ? (
                        <img src={post.coverImage} alt="cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                            <div className="text-slate-700 text-2xl">◈</div>
                            <span className="text-slate-700 font-mono text-[10px]">
                                {lang === 'zh' ? '暂无封面图' : 'No cover image'}
                            </span>
                        </div>
                    )}
                    {isEditing && (
                        <>
                            <input type="file" accept="image/*" className="hidden" id="blog-cover-upload"
                                onChange={e => uploadOrReplaceCover(e.target.files)} />
                            <label htmlFor="blog-cover-upload"
                                className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/20 transition-all opacity-0 hover:opacity-100">
                                <span className="text-white font-mono text-xs bg-black/60 px-3 py-1.5 rounded border border-white/20">
                                    {lang === 'zh' ? '替换封面' : 'Replace Cover'}
                                </span>
                            </label>
                            {post.coverImage && (
                                <button onClick={deleteCover}
                                    className="absolute top-2 right-2 text-white/60 hover:text-white font-mono text-xs px-2 py-0.5 bg-black/50 rounded border border-white/20 transition-colors">
                                    ✕
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Header */}
                <div className="space-y-3">
                    {isEditing ? (
                        <EditableText
                            value={post.title[lang] || post.title.zh}
                            tag="h1"
                            className="text-2xl font-semibold text-slate-100"
                            onSave={saveTitle}
                        />
                    ) : (
                        <h1 className="text-2xl font-semibold text-slate-100">{post.title[lang] || post.title.zh}</h1>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                        {post.tags.map(tag => (
                            <span key={tag}
                                className="text-slate-600 font-mono text-[10px] border border-slate-800 rounded px-2 py-0.5">
                                #{tag}
                            </span>
                        ))}
                        <span className="text-slate-700 font-mono text-xs">
                            {date}
                        </span>
                    </div>
                </div>

                {/* Block editor */}
                {id && (
                    <BlockEditor
                        projectId={id}
                        token={editorToken ?? ''}
                        blocks={blocks}
                        onBlocksChange={setBlocks}
                        apiBase="/api/blogs"
                        permissionKey="manage_blogs"
                    />
                )}
            </div>
        </Layout>
    )
}
