import { Layout } from '../components/Layout'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const services = [
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

export default function ServicesPage() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'

    return (
        <Layout>
            <div className="max-w-5xl mx-auto px-6 py-16">
                {/* Page header */}
                <div className="text-center mb-14">
                    <h1 className="text-4xl font-bold text-slate-100 tracking-tight">
                        Services
                    </h1>
                    <p className="mt-3 text-slate-500 text-base">
                        {lang === 'zh'
                            ? '我们提供从项目设计到长期运维的全栈服务，助您高效落地。'
                            : 'We provide full-stack services from project design to long-term operations, helping you ship faster.'}
                    </p>
                </div>

                {/* 2x2 grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {services.map((service) => (
                        <div
                            key={service.title.en}
                            className="bg-slate-900/40 border border-slate-800 rounded-lg p-6 hover:border-emerald-900/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.06)] transition-all duration-300"
                        >
                            <div className="text-3xl mb-3">{service.icon}</div>
                            <div className="text-slate-100 font-semibold text-base">
                                {service.title[lang]}
                            </div>
                            <div className="text-slate-500 text-sm leading-relaxed mt-2">
                                {service.description[lang]}
                            </div>

                            {/* Feature bullets */}
                            <ul className="mt-4 space-y-1.5">
                                {service.features.map((f) => (
                                    <li
                                        key={f.en}
                                        className="text-slate-600 text-xs font-mono flex items-center gap-2"
                                    >
                                        <span className="text-slate-700">→ </span>
                                        {f[lang]}
                                    </li>
                                ))}
                            </ul>

                            {/* Price range */}
                            <div className="mt-4 text-emerald-500 font-mono text-xs">
                                {t('services.budgetFrom')} {service.priceRange[lang]}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="border-t border-slate-800 mt-12 pt-10 flex flex-col items-center gap-5">
                    <p className="text-slate-400 font-mono text-sm tracking-widest">
                        {t('services.contactUs')}
                    </p>
                    <button
                        onClick={() => navigate('/contact')}
                        className="px-6 py-3 rounded border border-emerald-800 text-emerald-400 font-mono text-sm hover:bg-emerald-950/40 hover:border-emerald-600 transition-all"
                    >
                        {t('services.cta')} →
                    </button>
                </div>
            </div>
        </Layout>
    )
}