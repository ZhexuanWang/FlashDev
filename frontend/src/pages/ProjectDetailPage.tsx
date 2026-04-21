import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Project } from '../types/project'
import type { ProjectBlock } from '../types/block'
import { Layout } from '../components/Layout'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../store/authStore'
import { BlockEditor } from '../components/editor/BlockEditor/BlockEditor'
import { InquiryForm } from '../components/InquiryForm'

export default function ProjectDetailPage() {
    const { id }       = useParams<{ id: string }>()
    const navigate     = useNavigate()
    const { t, i18n } = useTranslation()
    const lang         = i18n.language === 'zh' ? 'zh' : 'en'
    const { token }    = useEditorStore()
    const { role }     = useAuthStore()

    const [project,     setProject]     = useState<Project | null>(null)
    const [blocks,      setBlocks]      = useState<ProjectBlock[]>([])
    const [loading,     setLoading]     = useState(true)

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

    return (
        <Layout backPath="/projects">
            <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

                {/* Header row */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-semibold text-slate-100">{project.title[lang]}</h1>
                        {project.category && (
                            <span className="inline-block mt-1 text-slate-500 font-mono text-xs
                                             border border-slate-800 rounded px-2 py-0.5">
                                {project.category.icon} {project.category.name[lang]}
                            </span>
                        )}
                    </div>

                    {/* Type badge + price */}
                    <div className="flex items-center gap-3">
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
                </div>

                {/* Block editor */}
                {id && (
                    <BlockEditor
                        projectId={id}
                        token={token ?? ''}
                        blocks={blocks}
                        onBlocksChange={setBlocks}
                    />
                )}

                {/* Inquiry form */}
                <InquiryForm project={project} />
            </div>
        </Layout>
    )
}
