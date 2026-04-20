import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
    { code: 'zh', label: '中文', flag: 'CN' },
    { code: 'en', label: 'English', flag: 'EN' },
]

export function LanguageToggle() {
    const { i18n } = useTranslation()
    const [expanded, setExpanded] = useState(false)
    const current = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0]

    return (
        <div
            className="relative z-30"
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
        >
            {/* Toggle button — always visible */}
            <button className="flex items-center justify-center w-6 h-14 bg-slate-900/80 border border-slate-700/50 border-l-0 rounded-r-lg text-slate-400 hover:text-sky-400 transition-colors">
                <span
                    className="text-[10px] font-mono font-bold tracking-widest"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                    {current.flag}
                </span>
            </button>

            {/* Language panel — slides in from the right */}
            <div
                className="absolute top-0 left-full bg-slate-900/90 border border-slate-700/50 border-l-0 rounded-r-lg overflow-hidden"
                style={{
                    width: expanded ? '100px' : '0px',
                    opacity: expanded ? 1 : 0,
                    transition: 'width 300ms ease, opacity 300ms ease',
                }}
            >
                <div className="w-[100px] py-2 space-y-1 px-2">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => i18n.changeLanguage(lang.code)}
                            className={`flex items-center gap-2 w-full px-2 py-2 rounded text-[11px] font-mono tracking-widest transition-colors ${
                                i18n.language === lang.code
                                    ? 'text-sky-400 bg-sky-500/10'
                                    : 'text-slate-500 hover:text-sky-300 hover:bg-sky-500/10'
                            }`}
                        >
                            <span className="text-xs font-bold">{lang.flag}</span>
                            <span>{lang.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
