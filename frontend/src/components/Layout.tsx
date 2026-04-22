import { useNavigate, useLocation } from 'react-router-dom'
import { LanguageToggle } from './LanguageToggle'
import { useTranslation } from 'react-i18next'
import { ThemeEditor } from './ThemeEditor'
import { useEditorStore } from '../store/editorStore'
import { useEffect, useState } from 'react'
import { SiteFooter } from './SiteFooter'

const ROUTE_TITLES: Record<string, string> = {
    '/home':     '',
    '/projects': 'projects.title',
    '/team':     'team.title',
    '/blogs':    'blogs.title',
    '/contact':  'contact.title',
    '/market':   'market.title',
    '/forum':    'forum.title',
    '/profile':  'profile.title',
}

interface LayoutProps {
    children: React.ReactNode
    showBack?: boolean
    backPath?: string
}

export function Layout({ children, showBack = true, backPath = '/home' }: LayoutProps) {
    const navigate  = useNavigate()
    const location  = useLocation()
    const { t }     = useTranslation()

    const titleKey = ROUTE_TITLES[location.pathname] ?? ''
    const { isEditing } = useEditorStore()
    const [themeConfig, setThemeConfig] = useState({ primary: '0ea5e9', glow: '38bdf8' })
    useEffect(() => {
        fetch('/api/site-config')
            .then(r => r.json())
            .then((configs: Record<string, string>) => {  // ← 改为 Record
                setThemeConfig({
                    primary: configs['theme.primary'] ?? '0ea5e9',  // ← 直接取 key
                    glow:    configs['theme.glow']    ?? '38bdf8',
                })
            })
    }, [])

    return (
        <div className="min-h-screen bg-[#000508] text-slate-200">
            <header className="border-b border-slate-800/60 px-6 py-4 flex items-center gap-4">
                {showBack && (
                    <button
                        onClick={() => navigate(backPath)}
                        className="text-sky-600 hover:text-brand font-mono text-xs tracking-widest transition-colors"
                    >
                        ← {t('common.back')}
                    </button>
                )}

                {titleKey && (
                    <h1 className="text-slate-300 font-mono text-sm tracking-[0.2em] uppercase">
                        {t(titleKey)}
                    </h1>
                )}

                {/* 语言切换推到右边 */}
                <div className="ml-auto">
                    <LanguageToggle />
                </div>
            </header>

            <main>{children}</main>

            <SiteFooter />

            {/* 主题编辑器 — 只在编辑模式下显示，ThemeEditor 内部再过滤非 COMPANY */}
            {isEditing && (
                <ThemeEditor
                    initialPrimary={themeConfig.primary}
                    initialGlow={themeConfig.glow}
                />
            )}
        </div>
    )
}