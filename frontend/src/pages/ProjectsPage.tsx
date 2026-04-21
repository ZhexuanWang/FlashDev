import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project, ProjectCategory, ProjectType } from '../types/project'
import { useTranslation } from 'react-i18next'
import { Layout } from '../components/Layout'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../store/authStore'
import { useHasPermission } from '../hooks/usePermissions'

const TYPE_KEYS = ['all', 'showcase', 'for_sale', 'custom'] as const
type TypeKey = typeof TYPE_KEYS[number]

const TYPE_COLORS: Record<ProjectType, string> = {
    SHOWCASE: 'text-brand border-sky-800',
    FOR_SALE: 'text-emerald-400 border-emerald-800',
    CUSTOM:   'text-amber-400 border-amber-800',
}

export default function ProjectsPage() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const navigate = useNavigate()

    const { token } = useEditorStore()
    const { role } = useAuthStore()
    const canManage = useHasPermission('manage_projects')
    const canEdit = !!(token && (role === 'COMPANY' || canManage))

    const [projects,        setProjects]        = useState<Project[]>([])
    const [categories,      setCategories]      = useState<ProjectCategory[]>([])
    const [activeCategory,  setActiveCategory]  = useState<string>('all')
    const [activeType,      setActiveType]      = useState<TypeKey>('all')
    const [loading,         setLoading]         = useState(true)
    const [showModal,       setShowModal]       = useState(false)
    const [deleting,        setDeleting]        = useState<string | null>(null)

    useEffect(() => {
        Promise.all([
            fetch('/api/projects').then(r => r.json()),
            fetch('/api/project-categories').then(r => r.json()),
        ]).then(([p, c]) => {
            setProjects(p)
            setCategories(c)
        }).finally(() => setLoading(false))
    }, [])

    const filtered = projects.filter(p => {
        const catOk  = activeCategory === 'all' || p.category?.id === activeCategory
        const typeMap: Record<string, ProjectType> = {
            showcase: 'SHOWCASE', for_sale: 'FOR_SALE', custom: 'CUSTOM',
        }
        const typeOk = activeType === 'all' || p.type === typeMap[activeType]
        return catOk && typeOk
    })

    const getTypeLabel = (typeKey: TypeKey) => {
        if (typeKey === 'all')      return t('projects.allTypes')
        if (typeKey === 'showcase') return t('projects.showcase')
        if (typeKey === 'for_sale') return t('projects.forSale')
        if (typeKey === 'custom')   return t('projects.custom')
        return typeKey
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm(lang === 'zh' ? '确认删除此项目？' : 'Delete this project?')) return
        setDeleting(id)
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                setProjects(prev => prev.filter(p => p.id !== id))
            }
        } finally {
            setDeleting(null)
        }
    }

    const handleCreate = async (data: {
        titleZh: string; titleEn: string
        descriptionZh: string; descriptionEn: string
        type: ProjectType; categoryId?: string; isPublished: boolean
    }) => {
        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ...data, media: [] }),
        })
        if (res.ok) {
            const newProject: Project = await res.json()
            setProjects(prev => [newProject, ...prev])
            setShowModal(false)
        }
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto px-6 py-10">

                {/* Header row */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-slate-200 font-mono text-base tracking-widest">
                            {t('projects.title')}
                        </h1>
                    </div>
                    {canEdit && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 rounded border border-sky-800 text-sky-400 font-mono text-xs
                                       hover:border-sky-500 hover:text-sky-300 transition-all"
                        >
                            + {lang === 'zh' ? '新建项目' : 'New Project'}
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-6 mb-10">
                    <div className="flex gap-2 flex-wrap">
                        {TYPE_KEYS.map(typeKey => (
                            <button
                                key={typeKey}
                                onClick={() => setActiveType(typeKey)}
                                className={`px-3 py-1 rounded font-mono text-xs border transition-all duration-200
                  ${activeType === typeKey
                                        ? 'bg-sky-900/40 border-sky-600 text-sky-300'
                                        : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {getTypeLabel(typeKey)}
                            </button>
                        ))}
                    </div>

                    {categories.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={`px-3 py-1 rounded font-mono text-xs border transition-all duration-200
                  ${activeCategory === 'all'
                                        ? 'bg-sky-900/40 border-sky-600 text-sky-300'
                                        : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {t('projects.allCategories')}
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-3 py-1 rounded font-mono text-xs border transition-all duration-200
                    ${activeCategory === cat.id
                                            ? 'bg-sky-900/40 border-sky-600 text-sky-300'
                                            : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {cat.icon} {cat.name[lang]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Loading skeleton */}
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="rounded-lg bg-slate-900/60 border border-slate-800 overflow-hidden animate-pulse">
                                <div className="aspect-video bg-slate-800" />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-slate-700 rounded w-3/4" />
                                    <div className="h-3 bg-slate-800 rounded w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="text-slate-700 text-5xl">◈</div>
                        <p className="text-slate-600 font-mono text-sm">{t('projects.noProjects')}</p>
                        <button
                            onClick={() => { setActiveCategory('all'); setActiveType('all') }}
                            className="text-sky-700 hover:text-sky-500 font-mono text-xs transition-colors"
                        >
                            {t('projects.clearFilters')}
                        </button>
                    </div>
                )}

                {/* Project grid */}
                {!loading && filtered.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                canEdit={canEdit}
                                deleting={deleting === project.id}
                                onClick={() => navigate(`/projects/${project.id}`)}
                                onDelete={(e) => handleDelete(project.id, e)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <NewProjectModal
                    categories={categories}
                    lang={lang}
                    onClose={() => setShowModal(false)}
                    onCreate={handleCreate}
                />
            )}
        </Layout>
    )
}

function ProjectCard({
    project, onClick, onDelete, canEdit, deleting,
}: {
    project: Project
    onClick: () => void
    onDelete: (e: React.MouseEvent) => void
    canEdit: boolean
    deleting: boolean
}) {
    const { i18n, t } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const thumb = project.media[0]
    const isVideo = thumb?.match(/\.(mp4|mov)$/i)

    const typeKey = project.type === 'FOR_SALE' ? 'forSale'
        : project.type === 'SHOWCASE' ? 'showcase'
        : 'custom'

    return (
        <div className="group relative rounded-lg bg-slate-900/60 border border-slate-800 overflow-hidden
                       cursor-pointer hover:border-sky-800 transition-all duration-300
                       hover:shadow-[0_0_20px_rgba(14,165,233,0.08)]">
            {/* Thumbnail */}
            <div className="aspect-video bg-slate-900 overflow-hidden relative">
                {thumb ? (
                    isVideo ? (
                        <video src={thumb} muted playsInline
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                        <img src={thumb} alt={project.title[lang]}
                            loading="lazy" width={400} height={225}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700 text-3xl">◈</div>
                )}

                {/* Type badge */}
                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded border font-mono text-[10px]
                          bg-black/60 backdrop-blur-sm ${TYPE_COLORS[project.type]}`}>
                    {t(`projects.${typeKey}`)}
                </span>

                {/* Delete button */}
                {canEdit && (
                    <button
                        onClick={onDelete}
                        disabled={deleting}
                        className="absolute top-2 left-2 w-7 h-7 rounded bg-black/70 border border-red-900
                                   text-red-400 font-mono text-xs
                                   hover:bg-red-900/60 hover:border-red-700 hover:text-red-300
                                   opacity-0 group-hover:opacity-100 transition-all
                                   disabled:opacity-50 disabled:cursor-not-allowed z-10"
                    >
                        {deleting ? '...' : '✕'}
                    </button>
                )}

                {/* Unpublished badge */}
                {!project.isPublished && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 border border-slate-700
                                     text-slate-500 font-mono text-[10px]">
                        {lang === 'zh' ? '未发布' : 'Unpublished'}
                    </span>
                )}
            </div>

            {/* Info */}
            <div onClick={onClick} className="p-4 space-y-2">
                <h3 className="text-slate-200 font-medium text-sm line-clamp-1">
                    {project.title[lang]}
                </h3>
                <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                    {project.description[lang]}
                </p>
                <div className="flex items-center justify-between pt-1">
                    {project.category && (
                        <span className="text-slate-600 text-[10px] font-mono">
                            {project.category.icon} {project.category.name[lang]}
                        </span>
                    )}
                    {project.price !== null && project.type === 'FOR_SALE' && (
                        <span className="text-emerald-400 text-xs font-mono ml-auto">
                            ¥{project.price.toLocaleString()}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

interface NewProjectModalProps {
    categories: ProjectCategory[]
    lang: 'zh' | 'en'
    onClose: () => void
    onCreate: (data: {
        titleZh: string; titleEn: string
        descriptionZh: string; descriptionEn: string
        type: ProjectType; categoryId?: string; isPublished: boolean
    }) => void
}

function NewProjectModal({ categories, lang, onClose, onCreate }: NewProjectModalProps) {
    const [titleZh, setTitleZh] = useState('')
    const [titleEn, setTitleEn] = useState('')
    const [descZh, setDescZh] = useState('')
    const [descEn, setDescEn] = useState('')
    const [type, setType] = useState<ProjectType>('SHOWCASE')
    const [categoryId, setCategoryId] = useState('')
    const [isPublished, setIsPublished] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await onCreate({
                titleZh, titleEn, descZh, descEn, type,
                categoryId: categoryId || undefined,
                isPublished,
            })
        } finally {
            setSubmitting(false)
        }
    }

    const typeOptions: { value: ProjectType; label: string }[] = [
        { value: 'SHOWCASE', label: lang === 'zh' ? '展示项目' : 'Showcase' },
        { value: 'FOR_SALE', label: lang === 'zh' ? '出售源码' : 'For Sale' },
        { value: 'CUSTOM',   label: lang === 'zh' ? '定制开发' : 'Custom' },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            <div
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg shadow-2xl"
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                    <h2 className="text-slate-200 font-mono text-sm">
                        {lang === 'zh' ? '新建项目' : 'New Project'}
                    </h2>
                    <button onClick={onClose}
                        className="text-slate-600 hover:text-slate-300 font-mono text-sm transition-colors">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Type */}
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                            {lang === 'zh' ? '类型' : 'Type'}
                        </label>
                        <div className="flex gap-2">
                            {typeOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setType(opt.value)}
                                    className={`px-3 py-1.5 rounded border font-mono text-xs transition-all
                                        ${type === opt.value
                                            ? 'border-sky-600 bg-sky-950/40 text-sky-300'
                                            : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Titles */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                                {lang === 'zh' ? '标题（中）' : 'Title (ZH)'}
                            </label>
                            <input
                                value={titleZh}
                                onChange={e => setTitleZh(e.target.value)}
                                required
                                placeholder={lang === 'zh' ? '中文标题' : 'Chinese title'}
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2
                                           text-slate-200 text-sm font-mono placeholder:text-slate-600
                                           focus:outline-none focus:border-sky-700 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                                {lang === 'zh' ? '标题（英）' : 'Title (EN)'}
                            </label>
                            <input
                                value={titleEn}
                                onChange={e => setTitleEn(e.target.value)}
                                required
                                placeholder={lang === 'zh' ? '英文标题' : 'English title'}
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2
                                           text-slate-200 text-sm font-mono placeholder:text-slate-600
                                           focus:outline-none focus:border-sky-700 transition-all"
                            />
                        </div>
                    </div>

                    {/* Descriptions */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                                {lang === 'zh' ? '简介（中）' : 'Desc (ZH)'}
                            </label>
                            <textarea
                                value={descZh}
                                onChange={e => setDescZh(e.target.value)}
                                rows={3}
                                required
                                placeholder={lang === 'zh' ? '中文简介' : 'Chinese description'}
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2
                                           text-slate-200 text-sm font-mono placeholder:text-slate-600 resize-none
                                           focus:outline-none focus:border-sky-700 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                                {lang === 'zh' ? '简介（英）' : 'Desc (EN)'}
                            </label>
                            <textarea
                                value={descEn}
                                onChange={e => setDescEn(e.target.value)}
                                rows={3}
                                required
                                placeholder={lang === 'zh' ? '英文简介' : 'English description'}
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2
                                           text-slate-200 text-sm font-mono placeholder:text-slate-600 resize-none
                                           focus:outline-none focus:border-sky-700 transition-all"
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                        <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                            {lang === 'zh' ? '分类' : 'Category'}
                        </label>
                        <select
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2
                                       text-slate-200 text-sm font-mono
                                       focus:outline-none focus:border-sky-700 transition-all"
                        >
                            <option value="">{lang === 'zh' ? '无分类' : 'No category'}</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.icon} {c.name[lang]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Published */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div
                            onClick={() => setIsPublished(v => !v)}
                            className={`w-8 h-4 rounded-full relative transition-all ${isPublished ? 'bg-sky-600' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isPublished ? 'left-4' : 'left-0.5'}`} />
                        </div>
                        <span className="text-slate-400 font-mono text-xs">
                            {lang === 'zh' ? '发布项目' : 'Publish project'}
                        </span>
                    </label>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 border border-slate-700 text-slate-500 font-mono text-xs rounded
                                       hover:border-slate-600 hover:text-slate-300 transition-all"
                        >
                            {lang === 'zh' ? '取消' : 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-2 bg-sky-900/40 border border-sky-700 text-sky-400 font-mono text-xs rounded
                                       hover:bg-sky-800/40 hover:border-sky-500 hover:text-sky-300 transition-all
                                       disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {submitting
                                ? (lang === 'zh' ? '创建中...' : 'Creating...')
                                : (lang === 'zh' ? '创建' : 'Create')
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
