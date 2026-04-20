import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Project } from '../types/project'
import { Layout }           from '../components/Layout'
import { EditableText }     from '../components/editor/EditableText'
import { EditableTextarea } from '../components/editor/EditableTextarea'
import { useEditorStore }   from '../store/editorStore'

export default function ProjectDetailPage() {
    const { id }       = useParams<{ id: string }>()
    const navigate     = useNavigate()
    const { t, i18n } = useTranslation()
    const lang         = i18n.language === 'zh' ? 'zh' : 'en'
    const { token }    = useEditorStore()

    const [project,     setProject]     = useState<Project | null>(null)
    const [loading,     setLoading]     = useState(true)
    const [activeMedia, setActiveMedia] = useState(0)

    useEffect(() => {
        if (!id) return
        fetch(`/api/projects/${id}`)
            .then(r => r.json())
            .then(setProject)
            .finally(() => setLoading(false))
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
                <p className="text-slate-600 font-mono text-sm">
                    {t('projects.noProjects')}
                </p>
                <button
                    onClick={() => navigate('/projects')}
                    className="text-sky-600 font-mono text-xs"
                >
                    {t('common.back')}
                </button>
            </div>
        )
    }

    // ✅ null 检查之后再定义 saveField，project 一定不为 null
    const saveField = async (field: string, value: string | Record<string, string>) => {
        await fetch(`/api/projects/${project.id}`, {
            method:  'PATCH',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ [field]: value }),
        })
    }

    const currentMedia = project.media[activeMedia]
    const isVideo      = currentMedia?.match(/\.(mp4|mov)$/i)

    return (
        <Layout backPath="/projects">
            <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

                {/* Media viewer */}
                {project.media.length > 0 && (
                    <div className="space-y-3">
                        <div className="aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                            {isVideo ? (
                                <video
                                    key={currentMedia}
                                    src={currentMedia}
                                    controls
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <img
                                    src={currentMedia}
                                    alt={project.title[lang]}
                                    width={800}
                                    height={450}
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </div>

                        {project.media.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {project.media.map((m, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveMedia(i)}
                                        className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border transition-all
                      ${i === activeMedia
                                            ? 'border-sky-500'
                                            : 'border-slate-700 opacity-50 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={m} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Info */}
                <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">

                            {/* 主标题 — 跟随语言切换 */}
                            <EditableText
                                value={project.title[lang]}
                                tag="h1"
                                className="text-xl font-semibold text-slate-100"
                                permission="manage_projects"
                                onSave={async (val) => {
                                    const updated = { ...project.title, [lang]: val }
                                    await saveField('title', updated)
                                    setProject(prev => prev ? { ...prev, title: updated } : prev)
                                }}
                            />
                        </div>

                        {/* 出售项目：价格 + 咨询按钮 */}
                        {project.price !== null && project.type === 'for_sale' && (
                            <div className="text-right">
                                <div className="text-emerald-400 text-2xl font-mono font-bold">
                                    ¥{project.price.toLocaleString()}
                                </div>
                                <button
                                    onClick={() => navigate('/contact')}
                                    className="mt-1 px-4 py-1.5 bg-emerald-900/40 border border-emerald-700
                             text-emerald-400 font-mono text-xs rounded
                             hover:bg-emerald-800/40 transition-all"
                                >
                                    {t('projects.consult')}
                                </button>
                            </div>
                        )}

                        {/* 定制项目：获取报价按钮 */}
                        {project.type === 'custom' && (
                            <button
                                onClick={() => navigate('/contact')}
                                className="px-4 py-1.5 bg-amber-900/30 border border-amber-700
                           text-amber-400 font-mono text-xs rounded
                           hover:bg-amber-800/30 transition-all"
                            >
                                {t('projects.getQuote')}
                            </button>
                        )}
                    </div>

                    {/* Category */}
                    {project.category && (
                        <span className="inline-block text-slate-500 font-mono text-xs
                             border border-slate-800 rounded px-2 py-0.5">
              {project.category.icon} {project.category.name[lang]}
            </span>
                    )}

                    {/* ✅ 描述 — 可内联编辑 */}
                    <div className="border-t border-slate-800/60 pt-4">
                        <EditableTextarea
                            value={project.description[lang]}
                            className="text-slate-400 leading-relaxed text-sm whitespace-pre-wrap"
                            rows={6}
                            permission="manage_projects"
                            onSave={async (val) => {
                                const updated = { ...project.description, [lang]: val }
                                await saveField('description', updated)
                                setProject(prev => prev ? { ...prev, description: updated } : prev)
                            }}
                        />
                    </div>
                </div>

            </div>
        </Layout>
    )
}