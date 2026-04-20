import { Layout } from '../components/Layout'
import { useTranslation } from 'react-i18next'

export default function ServicesPage() {
    const { t } = useTranslation()
    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-6 py-20 flex flex-col items-center gap-4">
                <div className="text-slate-700 text-5xl">⚙</div>
                <p className="text-slate-600 font-mono text-sm tracking-widest">
                    {t('nav.services')} — Coming Soon
                </p>
            </div>
        </Layout>
    )
}