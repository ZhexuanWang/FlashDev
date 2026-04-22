import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Project, ProjectCategory, ProjectType } from '../types/project'
import type { ProjectBlock } from '../types/block'
import { Layout } from '../components/Layout'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../store/authStore'
import { BlockEditor } from '../components/editor/BlockEditor/BlockEditor'
import { InquirySection } from '../components/InquirySection'
import { EditableText } from '../components/editor/EditableText'

const TYPE_COLORS: Record<ProjectType, string> = {
    SHOWCASE: 'text-brand border-sky-800',
    FOR_SALE: 'text-emerald-400 border-emerald-800',
    CUSTOM:   'text-amber-400 border-amber-800',
}

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
    const [categories, setCategories] = useState<ProjectCategory[]>([])
    const [loading, setLoading] = useState(true)

    // Inline selector states
    const [showTypePicker, setShowTypePicker] = useState(false)
    const [showCatPicker, setShowCatPicker] = useState(false)

    useEffect(() => {
        if (!id) return
        Promise.all([
            fetch(`/api/projects/${id}`).then(r => r.json()),
            fetch(`/api/projects/${id}/blocks`).then(r => r.json()),
            fetch('/api/project-categories').then(r => r.json()),
        ]).then(([p, b, cats]) => {
            setProject(p)
            setBlocks(b)
            setCategories(Array.isArray(cats) ? cats : [])
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

    const saveType = async (newType: ProjectType) => {
        if (!authToken || !id) return
        const res = await fetch(`/api/projects/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ type: newType }),
        })
        if (res.ok) setProject(JSON.parse(await res.text()))
        setShowTypePicker(false)
    }

    const saveCategory = async (catId: string | null) => {
        if (!authToken || !id) return
        const res = await fetch(`/api/projects/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ categoryId: catId ?? '' }),
        })
        if (res.ok) setProject(JSON.parse(await res.text()))
        setShowCatPicker(false)
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
                        {/* Category */}
                        <div className="relative">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => { setShowCatPicker(v => !v); setShowTypePicker(false) }}
                                        className="inline-block text-slate-500 font-mono text-xs border border-slate-800 rounded px-2 py-0.5
                                                   hover:border-sky-700 hover:text-slate-300 transition-all cursor-pointer"
                                    >
                                        {project.category
                                            ? `${project.category.icon} ${project.category.name[lang]} ▾`
                                            : (lang === 'zh' ? '+ 分类 ▾' : '+ Category ▾')
                                        }
                                    </button>
                                    {showCatPicker && (
                                        <div className="absolute top-full left-0 mt-1 z-20 bg-slate-900 border border-slate-700 rounded shadow-xl min-w-[160px] py-1">
                                            <button
                                                onClick={() => saveCategory(null)}
                                                className="w-full text-left px-3 py-1.5 text-slate-500 font-mono text-xs hover:bg-slate-800 hover:text-slate-300 transition-colors"
                                            >
                                                {lang === 'zh' ? '无分类' : 'No category'}
                                            </button>
                                            {categories.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => saveCategory(c.id)}
                                                    className={`w-full text-left px-3 py-1.5 font-mono text-xs hover:bg-slate-800 transition-colors
                                                        ${project.category?.id === c.id
                                                            ? 'text-sky-400 bg-sky-950/30'
                                                            : 'text-slate-400 hover:text-slate-200'}`}
                                                >
                                                    {c.icon} {c.name[lang]}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : project.category ? (
                                <span className="inline-block text-slate-500 font-mono text-xs border border-slate-800 rounded px-2 py-0.5">
                                    {project.category.icon} {project.category.name[lang]}
                                </span>
                            ) : null}
                        </div>

                        {/* Type */}
                        <div className="relative">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => { setShowTypePicker(v => !v); setShowCatPicker(false) }}
                                        className={`px-2 py-0.5 rounded border font-mono text-[10px] cursor-pointer transition-all hover:opacity-80
                                            ${TYPE_COLORS[project.type]}`}
                                    >
                                        {t(`projects.${typeKey}`)} ▾
                                    </button>
                                    {showTypePicker && (
                                        <div className="absolute top-full left-0 mt-1 z-20 bg-slate-900 border border-slate-700 rounded shadow-xl min-w-[120px] py-1">
                                            {(['SHOWCASE', 'FOR_SALE', 'CUSTOM'] as ProjectType[]).map(type => {
                                                const key = type === 'FOR_SALE' ? 'forSale' : type.toLowerCase() as 'showcase' | 'custom'
                                                return (
                                                    <button
                                                        key={type}
                                                        onClick={() => saveType(type)}
                                                        className={`w-full text-left px-3 py-1.5 font-mono text-xs hover:bg-slate-800 transition-colors
                                                            ${project.type === type ? 'text-sky-400 bg-sky-950/30' : 'text-slate-400 hover:text-slate-200'}`}
                                                    >
                                                        {t(`projects.${key}`)}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <span className={`px-2 py-0.5 rounded border font-mono text-[10px]
                                    ${TYPE_COLORS[project.type]}`}>
                                    {t(`projects.${typeKey}`)}
                                </span>
                            )}
                        </div>
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
