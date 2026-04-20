import { useTranslation } from 'react-i18next'

export function LanguageToggle() {
    const { i18n } = useTranslation()
    const isZh = i18n.language === 'zh'

    const toggle = () => {
        const next = isZh ? 'en' : 'zh'
        i18n.changeLanguage(next)
        // RTL 支持：阿拉伯语等从右到左
        document.documentElement.setAttribute('dir',
            next === 'ar' ? 'rtl' : 'ltr'
        )
    }

    return (
        <button
            onClick={toggle}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-700/60
                 text-slate-400 hover:text-brand hover:border-sky-800
                 font-mono text-xs tracking-wide transition-all duration-200"
            aria-label="Toggle language"
        >
            <span className={isZh ? 'text-brand' : 'text-slate-500'}>中</span>
            <span className="text-slate-600">/</span>
            <span className={!isZh ? 'text-brand' : 'text-slate-500'}>EN</span>
        </button>
    )
}