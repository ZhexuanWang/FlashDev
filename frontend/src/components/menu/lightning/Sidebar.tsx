import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../../store/authStore'

const NAV_KEYS = ['projects', 'services', 'team', 'contact', 'blogs'] as const

export function Sidebar() {
    const { t } = useTranslation()
    const { isAuthenticated } = useAuthStore()
    const [expanded, setExpanded] = useState(false)

    return (
        <aside
            className="z-30 flex"
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
        >
            {/* Toggle tab */}
            <button className="w-6 h-14 flex items-center justify-center bg-slate-900/80 border border-slate-700/50 border-l-0 rounded-r-lg text-slate-400 hover:text-sky-400 transition-colors">
                <span
                    className="text-xs transition-transform duration-300"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                    {expanded ? '◀' : '▶'}
                </span>
            </button>

            {/* Menu panel */}
            <nav
                className="bg-slate-900/90 border border-slate-700/50 border-l-0 rounded-r-lg overflow-hidden transition-all duration-300"
                style={{
                    width: expanded ? '140px' : '0',
                    opacity: expanded ? 1 : 0,
                }}
            >
                <div className="w-[140px] py-3 space-y-1 px-2">
                    {/* Login / Account */}
                    <Link
                        to={isAuthenticated ? '/permissions' : '/login'}
                        className="flex items-center gap-2 px-2 py-2 rounded text-[11px] font-mono tracking-widest text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
                    >
                        <span className="text-sm">{isAuthenticated ? '⚙' : '⏻'}</span>
                        <span>{isAuthenticated ? 'ACCOUNT' : 'LOGIN'}</span>
                    </Link>

                    <div className="h-px bg-slate-700/50 my-2" />

                    {/* Nav items */}
                    {NAV_KEYS.map((key) => (
                        <Link
                            key={key}
                            to={`/${key}`}
                            className="flex items-center gap-2 px-2 py-2 rounded text-[11px] font-mono tracking-widest text-slate-500 hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
                        >
                            <span>{t(`nav.${key}`)}</span>
                        </Link>
                    ))}
                </div>
            </nav>
        </aside>
    )
}
