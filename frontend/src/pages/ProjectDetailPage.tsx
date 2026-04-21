import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Project } from '../types/project'
import type { ProjectBlock } from '../types/block'
import { Layout } from '../components/Layout'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../store/authStore'
import { BlockEditor } from '../components/editor/BlockEditor/BlockEditor'
import { InquirySection } from '../components/InquirySection'
import { EditableText } from '../components/editor/EditableText'

export default function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'

    const authToken = useAuthStore(s => s.token)
    const editorToken = useEditorStore(s => s.token)
    const role = useAuthStore(s => s.role)
    const token = useEditorStore(s => s.token)
    const isEditing = !!(token && (role === 'COMPANY' || role === 'ADMIN'))

    const [project, setProject] = useState<Project | null>(null)
    const [blocks, setBlocks] = useState<ProjectBlock[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        Promise.all([
            fetch(`/api/projects/${id}`).then(r => r.json()),
            fetch(`/api/projects/${id}/blocks`).then(r => r.json()),
        ]).then(([p, b]) => {
            setProject(p)
            setBlocks(b)
        }).finally(() => setLoading(false))
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#000508] flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
            </div>
        )
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-[#000508] flex flex-col items-center justify-center gap-4">
                <p className="text-slate-600 font-mono text-sm">{t('projects.noProjects')}</p>
                <button onClick={() => navigate('/projects')} className="text-sky-600 font-mono text-xs">
                    {t('common.back')}
                </button>
            </div>
        )
    }

    const typeKey = project.type === 'FOR_SALE' ? 'forSale'
        : project.type === 'SHOWCASE' ? 'showcase'
        : 'custom'

    const saveTitle = async (newTitle: string) => {
        if (!authToken || !id) return
        const res = await fetch(`/api/projects/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ title: { ...project.title, [lang]: newTitle } }),
        })
        if (res.ok) setProject(JSON.parse(await res.text()))
    }

    const uploadOrReplaceCover = async (files: FileList | null) => {
        if (!files?.length) return
        const uploadToken = authToken ?? editorToken
        if (!uploadToken || !id) return
        const formData = new FormData()
        formData.append('files', files[0])
        const res = await fetch('/api/posters/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${uploadToken}` },
            body: formData,
        })
        if (!res.ok) return
        const { urls } = await res.json()
        // Always single image: replace at index 0, or set if empty
        const res2 = await fetch(`/api/projects/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${uploadToken}` },
            body: JSON.stringify({ media: [urls[0]] }),
        })
        if (res2.ok) setProject(JSON.parse(await res2.text()))
    }

    const deleteCover = async () => {
        const removeToken = authToken ?? editorToken
        if (!removeToken || !id) return
        const res = await fetch(`/api/projects/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${removeToken}` },
            body: JSON.stringify({ media: [] }),
        })
        if (res.ok) setProject(JSON.parse(await res.text()))
    }

    return (
        <Layout backPath="/projects">
            <div className="w-[90vw] max-w-6xl mx-auto px-6 py-10 space-y-8">

                {/* Header row */}
                <div className="space-y-3">
                    {isEditing ? (
                        <EditableText
                            value={project.title[lang]}
                            tag="h1"
                            className="text-xl font-semibold text-slate-100"
                            onSave={saveTitle}
                        />
                    ) : (
                        <h1 className="text-xl font-semibold text-slate-100">{project.title[lang]}</h1>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                        {project.category && (
                            <span className="inline-block text-slate-500 font-mono text-xs border border-slate-800 rounded px-2 py-0.5">
                                {project.category.icon} {project.category.name[lang]}
                            </span>
                        )}
                        <span className={`px-2 py-0.5 rounded border font-mono text-[10px]
                            ${project.type === 'FOR_SALE' ? 'text-emerald-400 border-emerald-800' :
                              project.type === 'CUSTOM'   ? 'text-amber-400 border-amber-800' :
                              'text-brand border-sky-800'}`}>
                            {t(`projects.${typeKey}`)}
                        </span>
                        {project.price !== null && (
                            <span className="text-emerald-400 text-xl font-mono font-bold">
                                ¥{project.price.toLocaleString()}
                            </span>
                        )}
                    </div>

                    {/* Cover — single image */}
                    <div className="relative w-full aspect-[2/1] bg-slate-900 rounded-lg overflow-hidden">
                        {project.media[0] ? (
                            <img
                                src={project.media[0]}
                                alt="cover"
                                className="w-full h-full object-cover"
                            />
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
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    className="hidden"
                                    id="cover-upload"
                                    onChange={e => uploadOrReplaceCover(e.target.files)}
                                />
                                <label
                                    htmlFor="cover-upload"
                                    className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/20 transition-all opacity-0 hover:opacity-100"
                                >
                                    <span className="text-white font-mono text-xs bg-black/60 px-3 py-1.5 rounded border border-white/20">
                                        {lang === 'zh' ? '替换封面' : 'Replace Cover'}
                                    </span>
                                </label>
                                {project.media[0] && (
                                    <button
                                        onClick={deleteCover}
                                        className="absolute top-2 right-2 text-white/60 hover:text-white font-mono text-xs px-2 py-0.5 bg-black/50 rounded border border-white/20 transition-colors"
                                    >
                                        ✕
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Block editor */}
                {id && (
                    <BlockEditor
                        projectId={id}
                        token={editorToken ?? ''}
                        blocks={blocks}
                        onBlocksChange={setBlocks}
                    />
                )}

                <InquirySection project={project} />
            </div>
        </Layout>
    )
}
