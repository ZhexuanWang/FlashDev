import { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../store/authStore'

// ---------------------------------------------------------------------------
// Types & default data
// ---------------------------------------------------------------------------

interface Bilingual {
    zh: string
    en: string
}

interface Service {
    icon: string
    title: Bilingual
    description: Bilingual
    features: Bilingual[]
    priceRange: Bilingual
}

const defaultServices: Service[] = [
    {
        icon: '🎯',
        title: { zh: '项目设计', en: 'Project Design' },
        description: {
            zh: '从想法到上线的完整项目设计方案，包含技术选型、架构设计、开发流程规划。',
            en: 'Complete project design from idea to launch, including tech stack selection, architecture planning, and development workflow.',
        },
        features: [
            { zh: '技术选型与可行性评估', en: 'Tech stack & feasibility evaluation' },
            { zh: '系统架构设计', en: 'System architecture design' },
            { zh: '开发里程碑规划', en: 'Development milestone planning' },
        ],
        priceRange: { zh: '¥2,000 起', en: 'From ¥2,000' },
    },
    {
        icon: '🌐',
        title: { zh: '跨语言沟通代理', en: 'Cross-Language Communication' },
        description: {
            zh: '代表客户与境外的个人开发者或团队进行英文沟通，协调需求、进度与质量。',
            en: 'Acting as your communication representative with overseas freelancers or teams in English, coordinating requirements, progress, and quality.',
        },
        features: [
            { zh: '英文需求文档撰写', en: 'English requirement documentation' },
            { zh: '进度同步与协调会议', en: 'Progress sync & coordination meetings' },
            { zh: '代码审查与质量把控', en: 'Code review & quality control' },
        ],
        priceRange: { zh: '¥1,000/月 起', en: 'From ¥1,000/month' },
    },
    {
        icon: '🖥',
        title: { zh: '项目托管', en: 'Project Hosting' },
        description: {
            zh: '服务器部署、运维托管、域名管理、DNS 配置、SSL 证书维护。',
            en: 'Server deployment, operations hosting, domain management, DNS configuration, and SSL certificate maintenance.',
        },
        features: [
            { zh: '云服务器部署与配置', en: 'Cloud server deployment & config' },
            { zh: 'CI/CD 自动化流水线', en: 'CI/CD automation pipelines' },
            { zh: '监控告警与故障响应', en: 'Monitoring alerts & incident response' },
        ],
        priceRange: { zh: '¥500/月 起', en: 'From ¥500/month' },
    },
    {
        icon: '🚀',
        title: { zh: '现有项目拓展', en: 'Project Extension' },
        description: {
            zh: '对接第三方 API、重构遗留代码、添加新功能模块、性能优化。',
            en: 'Integrating third-party APIs, refactoring legacy code, adding new feature modules, and performance optimization.',
        },
        features: [
            { zh: '第三方 API 对接', en: 'Third-party API integration' },
            { zh: '遗留代码重构', en: 'Legacy code refactoring' },
            { zh: '性能分析与优化', en: 'Performance analysis & optimization' },
        ],
        priceRange: { zh: '¥1,500 起', en: 'From ¥1,500' },
    },
]

// ---------------------------------------------------------------------------
// Key helpers
// ---------------------------------------------------------------------------

const pageTitleKey    = 'services.title'
const pageSubtitleKey = 'services.subtitle'

function cardKey(index: number, field: string) {
    return `services.card${index}.${field}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ServicesPage() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'

    // Auth / edit mode
    const { token } = useEditorStore()
    const { role }  = useAuthStore()
    const isEditing = !!(token && role === 'COMPANY')

    // Page-level editable texts
    const [pageTitle,    setPageTitle]    = useState({ zh: 'Services', en: 'Services' })
    const [pageSubtitle, setPageSubtitle] = useState({
        zh: '我们提供从项目设计到长期运维的全栈服务，助您高效落地。',
        en: 'We provide full-stack services from project design to long-term operations, helping you ship faster.',
    })

    // Service cards
    const [services, setServices] = useState<Service[]>(defaultServices)

    // ---------------------------------------------------------------------------
    // Load from site-config on mount
    // ---------------------------------------------------------------------------

    useEffect(() => {
        const keys = [
            pageTitleKey,
            pageSubtitleKey,
            ...defaultServices.flatMap((s, i) => [
                cardKey(i, 'title'),
                cardKey(i, 'description'),
                cardKey(i, 'priceRange'),
                cardKey(i, 'features'),
            ]),
        ]

        Promise.all(
            keys.map(key =>
                fetch(`/api/site-config/${key}`)
                    .then(r => (r.ok ? r.json() : null))
                    .then(d => (d ? { key, value: d.value } : null))
                    .catch(() => null)
            )
        ).then(results => {
            const parsed: Record<string, string> = {}
            results.forEach(r => { if (r) parsed[r.key] = r.value })

            const tryParse = <T,>(key: string, fallback: T): T => {
                const raw = parsed[key]
                if (!raw) return fallback
                try { return JSON.parse(raw) as T } catch { return fallback }
            }

            setPageTitle(tryParse(pageTitleKey, pageTitle))
            setPageSubtitle(tryParse(pageSubtitleKey, pageSubtitle))

            setServices(prev =>
                prev.map((s, i) => ({
                    ...s,
                    title:       tryParse(cardKey(i, 'title'),       s.title),
                    description: tryParse(cardKey(i, 'description'), s.description),
                    priceRange:  tryParse(cardKey(i, 'priceRange'),  s.priceRange),
                    features:    tryParse(cardKey(i, 'features'),    s.features),
                }))
            )
        })
    }, [])

    // ---------------------------------------------------------------------------
    // Save handler
    // ---------------------------------------------------------------------------

    const saveField = async (key: string, value: unknown) => {
        if (!token) return
        await fetch(`/api/site-config/${key}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ value: JSON.stringify(value) }),
        })
    }

    // ---------------------------------------------------------------------------
    // Inline edit-mode controls
    // ---------------------------------------------------------------------------

    // Bilingual input pair — shows the current language's value as a single
    // input; saves a full {zh,en} JSON object on blur.
    function BilingualInput({
        value,
        onSave,
        className = '',
        placeholder = '',
    }: {
        value: Bilingual
        onSave: (v: Bilingual) => void
        className?: string
        placeholder?: string
    }) {
        const [local, setLocal] = useState(value[lang])
        useEffect(() => { setLocal(value[lang]) }, [value, lang])

        return (
            <input
                value={local}
                onChange={e => setLocal(e.target.value)}
                onBlur={() => onSave({ ...value, [lang]: local })}
                placeholder={placeholder}
                className={`bg-slate-800 border border-sky-700 rounded px-2 py-1
                            text-slate-200 font-mono text-sm w-full outline-none
                            focus:border-sky-400 transition-colors ${className}`}
            />
        )
    }

    // Feature list JSON editor — only shown in edit mode so COMPANY can
    // edit the feature array as raw JSON.
    function FeaturesEditor({ value, onSave }: { value: Bilingual[]; onSave: (v: Bilingual[]) => void }) {
        const [local, setLocal] = useState(JSON.stringify(value, null, 2))

        const handleBlur = () => {
            try {
                const parsed = JSON.parse(local) as Bilingual[]
                // Validate shape
                if (Array.isArray(parsed) && parsed.every(f => f.zh && f.en)) {
                    onSave(parsed)
                }
            } catch {
                // Revert on invalid JSON
                setLocal(JSON.stringify(value, null, 2))
            }
        }

        return (
            <div>
                <textarea
                    value={local}
                    onChange={e => setLocal(e.target.value)}
                    onBlur={handleBlur}
                    rows={4}
                    className="w-full bg-slate-800 border border-sky-700 rounded px-2 py-1
                               text-slate-200 font-mono text-xs outline-none resize-none
                               focus:border-sky-400 transition-colors"
                />
                <span className="text-[9px] font-mono text-slate-600 mt-0.5 block">
                    {t('editor.clickToEdit')} — JSON format: [&#123;&#123;"zh":"...","en":"..."&#125;&#125;]
                </span>
            </div>
        )
    }

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    return (
        <Layout>
            <div className="max-w-5xl mx-auto px-6 py-16">

                {/* Page header — editable title + subtitle */}
                <div className="text-center mb-14">
                    <div className="relative group inline-block w-full">
                        {isEditing ? (
                            <input
                                value={pageTitle[lang]}
                                onChange={e => setPageTitle(p => ({ ...p, [lang]: e.target.value }))}
                                onBlur={() => saveField(pageTitleKey, pageTitle)}
                                className="bg-transparent border-b border-sky-500 outline-none
                                           w-full text-4xl font-bold text-slate-100 tracking-tight
                                           text-center text-sky-200 caret-sky-400"
                            />
                        ) : (
                            <h1 className="text-4xl font-bold text-slate-100 tracking-tight">
                                {pageTitle[lang]}
                            </h1>
                        )}
                    </div>
                    <div className="relative group mt-3">
                        {isEditing ? (
                            <input
                                value={pageSubtitle[lang]}
                                onChange={e => setPageSubtitle(p => ({ ...p, [lang]: e.target.value }))}
                                onBlur={() => saveField(pageSubtitleKey, pageSubtitle)}
                                className="bg-transparent border-b border-sky-500 outline-none
                                           w-full text-slate-500 text-base text-center text-sky-200/70
                                           caret-sky-400"
                            />
                        ) : (
                            <p className="text-slate-500 text-base">{pageSubtitle[lang]}</p>
                        )}
                    </div>
                </div>

                {/* 2x2 service cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {services.map((svc, idx) => (
                        <div
                            key={svc.title.en}
                            className={`bg-slate-900/40 border rounded-lg p-6
                                        hover:shadow-[0_0_20px_rgba(16,185,129,0.06)]
                                        transition-all duration-300
                                        ${isEditing
                                            ? 'border-dashed border-sky-800 hover:border-sky-700'
                                            : 'border-slate-800 hover:border-emerald-900/60'
                                        }`}
                        >
                            <div className="text-3xl mb-3">{svc.icon}</div>

                            {/* Title */}
                            <div className="min-h-[1.5rem]">
                                {isEditing ? (
                                    <BilingualInput
                                        value={svc.title}
                                        onSave={updated => {
                                            setServices(prev =>
                                                prev.map((s, i) =>
                                                    i === idx ? { ...s, title: updated } : s
                                                )
                                            )
                                            saveField(cardKey(idx, 'title'), updated)
                                        }}
                                        placeholder="Service title"
                                        className="mb-1"
                                    />
                                ) : (
                                    <span className="text-slate-100 font-semibold text-base">{svc.title[lang]}</span>
                                )}
                            </div>

                            {/* Description */}
                            <div className="min-h-[4rem]">
                                {isEditing ? (
                                    <textarea
                                        value={svc.description[lang]}
                                        onChange={e =>
                                            setServices(prev =>
                                                prev.map((s, i) =>
                                                    i === idx
                                                        ? { ...s, description: { ...s.description, [lang]: e.target.value } }
                                                        : s
                                                )
                                            )
                                        }
                                        onBlur={() =>
                                            saveField(cardKey(idx, 'description'), svc.description)
                                        }
                                        rows={3}
                                        className="w-full bg-slate-800 border border-sky-700 rounded px-2 py-1
                                                   text-slate-200 font-mono text-sm outline-none resize-none
                                                   focus:border-sky-400 transition-colors mt-2"
                                    />
                                ) : (
                                    <p className="text-slate-500 text-sm leading-relaxed mt-2">{svc.description[lang]}</p>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="mt-4 space-y-1.5">
                                {isEditing ? (
                                    <FeaturesEditor
                                        value={svc.features}
                                        onSave={updated => {
                                            setServices(prev =>
                                                prev.map((s, i) =>
                                                    i === idx ? { ...s, features: updated } : s
                                                )
                                            )
                                            saveField(cardKey(idx, 'features'), updated)
                                        }}
                                    />
                                ) : (
                                    svc.features.map(f => (
                                        <li
                                            key={f.en}
                                            className="text-slate-600 text-xs font-mono flex items-center gap-2"
                                        >
                                            <span className="text-slate-700">→ </span>
                                            {f[lang]}
                                        </li>
                                    ))
                                )}
                            </ul>

                            {/* Price range */}
                            <div className="min-h-[1.25rem] mt-4">
                                {isEditing ? (
                                    <BilingualInput
                                        value={svc.priceRange}
                                        onSave={updated => {
                                            setServices(prev =>
                                                prev.map((s, i) =>
                                                    i === idx ? { ...s, priceRange: updated } : s
                                                )
                                            )
                                            saveField(cardKey(idx, 'priceRange'), updated)
                                        }}
                                        placeholder="Price range"
                                    />
                                ) : (
                                    <div className="text-emerald-500 font-mono text-xs">
                                        {t('services.budgetFrom')} {svc.priceRange[lang]}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="border-t border-slate-800 mt-12 pt-10 flex flex-col items-center gap-5">
                    <p className="text-slate-400 font-mono text-sm tracking-widest">
                        {t('services.contactUs')}
                    </p>
                    <Link
                        to="/contact"
                        className="px-6 py-3 rounded border border-emerald-800 text-emerald-400
                                   font-mono text-sm hover:bg-emerald-950/40 hover:border-emerald-600
                                   transition-all"
                    >
                        {t('services.cta')} →
                    </Link>
                </div>
            </div>
        </Layout>
    )
}

