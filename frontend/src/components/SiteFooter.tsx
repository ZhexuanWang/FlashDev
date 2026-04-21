import { useTranslation } from 'react-i18next'

export function SiteFooter() {
    const { i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'

    return (
        <footer className="border-t border-slate-800/60 mt-12 py-5 text-center">
            <p className="text-slate-700 font-mono text-[10px] tracking-widest">
                © {new Date().getFullYear()} FlashDev. {lang === 'zh' ? '版权所有' : 'All rights reserved.'}
            </p>
        </footer>
    )
}
