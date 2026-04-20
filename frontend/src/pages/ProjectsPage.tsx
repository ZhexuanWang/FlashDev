import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project, ProjectCategory, ProjectType } from '../types/project'
import { useTranslation } from 'react-i18next'
import { Layout } from '../components/Layout'

const TYPE_KEYS = ['all', 'showcase', 'for_sale', 'custom'] as const

const TYPE_COLORS: Record<ProjectType, string> = {
    showcase: 'text-brand border-sky-800',
    for_sale: 'text-emerald-400 border-emerald-800',
    custom:   'text-amber-400 border-amber-800',
}

export default function ProjectsPage() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const navigate = useNavigate()

    const [projects,        setProjects]        = useState<Project[]>([])
    const [categories,      setCategories]      = useState<ProjectCategory[]>([])
    const [activeCategory,  setActiveCategory]  = useState<string>('all')
    const [activeType,      setActiveType]      = useState<string>('all')
    const [loading,         setLoading]         = useState(true)

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
        const typeOk = activeType === 'all'     || p.type === activeType
        return catOk && typeOk
    })

    // 类型标签用 i18n，key 改名为 typeKey 避免和 t() 冲突
    const getTypeLabel = (typeKey: string) => {
        if (typeKey === 'all')      return t('projects.allTypes')
        if (typeKey === 'showcase') return t('projects.showcase')
        if (typeKey === 'for_sale') return t('projects.forSale')
        if (typeKey === 'custom')   return t('projects.custom')
        return typeKey
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto px-6 py-10">

                {/* Filters */}
                <div className="flex flex-wrap gap-6 mb-10">

                    {/* Type filter — 循环变量改名为 typeKey */}
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

                    {/* Category filter */}
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
                                    <div className="h-3 bg-slate-800 rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="text-slate-700 text-5xl">◈</div>
                        <p className="text-slate-600 font-mono text-sm">
                            {t('projects.noProjects')}
                        </p>
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
                                onClick={() => navigate(`/projects/${project.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    )
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
    const { i18n, t } = useTranslation()
    const lang  = i18n.language === 'zh' ? 'zh' : 'en'
    const thumb = project.media[0]
    const isVideo = thumb?.match(/\.(mp4|mov)$/i)

    return (
        <div
            onClick={onClick}
            className="group rounded-lg bg-slate-900/60 border border-slate-800 overflow-hidden
                 cursor-pointer hover:border-sky-800 transition-all duration-300
                 hover:shadow-[0_0_20px_rgba(14,165,233,0.08)]"
        >
            {/* Thumbnail */}
            <div className="aspect-video bg-slate-900 overflow-hidden relative">
                {thumb ? (
                    isVideo ? (
                        <video
                            src={thumb} muted playsInline
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <img
                            src={thumb} alt={project.title[lang]}
                            loading="lazy"
                            width={400} height={225}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    )
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700 text-3xl">◈</div>
                )}

                {/* Type badge */}
                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded border font-mono text-[10px]
                          bg-black/60 backdrop-blur-sm ${TYPE_COLORS[project.type]}`}>
          {t(`projects.${project.type === 'for_sale' ? 'forSale' : project.type}`)}
        </span>
            </div>

            {/* Info */}
            <div className="p-4 space-y-2">
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
                    {project.price !== null && project.type === 'for_sale' && (
                        <span className="text-emerald-400 text-xs font-mono ml-auto">
              ¥{project.price.toLocaleString()}
            </span>
                    )}
                    {project.type === 'custom' && (
                        <span className="text-amber-400/70 text-[10px] font-mono ml-auto">
              {t('projects.negotiable')}
            </span>
                    )}
                </div>
            </div>
        </div>
    )
}