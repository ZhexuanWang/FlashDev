import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Layout } from '../components/Layout'

interface FormState {
    name:    string
    email:   string
    subject: string
    message: string
}

type Status = 'idle' | 'sending' | 'success' | 'error'

export default function ContactPage() {
    const { t } = useTranslation()
    const [form, setForm] = useState<FormState>({
        name: '', email: '', subject: '', message: '',
    })
    const [status,   setStatus]   = useState<Status>('idle')
    const [errorMsg, setErrorMsg] = useState('')

    const set = (key: keyof FormState) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm(prev => ({ ...prev, [key]: e.target.value }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('sending')
        setErrorMsg('')

        try {
            const res = await fetch('/api/contact', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    name:    form.name,
                    email:   form.email,
                    subject: form.subject,
                    message: form.message,
                }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(
                    Array.isArray(data?.message)
                        ? data.message.join(', ')
                        : data?.message ?? t('contact.errorDefault')
                )
            }

            setStatus('success')
            setForm({ name: '', email: '', subject: '', message: '' })
        } catch (err) {
            setStatus('error')
            setErrorMsg(err instanceof Error ? err.message : t('contact.errorDefault'))
        }
    }

    return (
        <Layout>
            <div className="max-w-xl mx-auto px-6 py-14">
                {status === 'success' ? (
                    <div className="flex flex-col items-center gap-6 py-20 text-center">
                        <div className="text-5xl">⚡</div>
                        <h2 className="text-brand font-mono text-lg tracking-wide">
                            {t('contact.success')}
                        </h2>
                        <p className="text-slate-500 text-sm">
                            {t('contact.successMsg')}
                        </p>
                        <button
                            onClick={() => setStatus('idle')}
                            className="mt-2 px-5 py-2 border border-sky-800 text-sky-500 font-mono text-xs
                         rounded hover:border-sky-600 hover:text-sky-300 transition-all"
                        >
                            {t('contact.sendAnother')}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <p className="text-slate-500 text-sm leading-relaxed mb-8">
                            {t('contact.subtitle')}
                        </p>

                        {/* Name */}
                        <div className="space-y-1.5">
                            <label htmlFor="f-name"
                                   className="text-slate-500 font-mono text-[10px] tracking-[0.15em] uppercase">
                                {t('contact.name')}
                            </label>
                            <input
                                id="f-name"
                                type="text"
                                value={form.name}
                                onChange={set('name')}
                                required
                                maxLength={50}
                                placeholder={t('contact.namePlaceholder')}
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-4 py-2.5
                           text-slate-200 text-sm font-mono placeholder:text-slate-600
                           focus:outline-none focus:border-sky-700 transition-all duration-200"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label htmlFor="f-email"
                                   className="text-slate-500 font-mono text-[10px] tracking-[0.15em] uppercase">
                                {t('contact.email')}
                            </label>
                            <input
                                id="f-email"
                                type="email"
                                value={form.email}
                                onChange={set('email')}
                                required
                                placeholder={t('contact.emailPlaceholder')}
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-4 py-2.5
                           text-slate-200 text-sm font-mono placeholder:text-slate-600
                           focus:outline-none focus:border-sky-700 transition-all duration-200"
                            />
                        </div>

                        {/* Subject */}
                        <div className="space-y-1.5">
                            <label htmlFor="f-subject"
                                   className="text-slate-500 font-mono text-[10px] tracking-[0.15em] uppercase">
                                {t('contact.subject')}
                            </label>
                            <input
                                id="f-subject"
                                type="text"
                                value={form.subject}
                                onChange={set('subject')}
                                required
                                maxLength={100}
                                placeholder={t('contact.subjectPlaceholder')}
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-4 py-2.5
                           text-slate-200 text-sm font-mono placeholder:text-slate-600
                           focus:outline-none focus:border-sky-700 transition-all duration-200"
                            />
                        </div>

                        {/* Message */}
                        <div className="space-y-1.5">
                            <label htmlFor="f-message"
                                   className="text-slate-500 font-mono text-[10px] tracking-[0.15em] uppercase">
                                {t('contact.message')}
                            </label>
                            <textarea
                                id="f-message"
                                value={form.message}
                                onChange={set('message')}
                                required
                                minLength={10}
                                maxLength={2000}
                                rows={6}
                                placeholder={t('contact.messagePlaceholder')}
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-4 py-2.5
                           text-slate-200 text-sm font-mono placeholder:text-slate-600
                           focus:outline-none focus:border-sky-700 transition-all duration-200 resize-none"
                            />
                            <span className="text-slate-700 font-mono text-[10px] text-right block">
                {form.message.length} / 2000
              </span>
                        </div>

                        {/* Error */}
                        {status === 'error' && (
                            <p className="text-red-500/80 font-mono text-xs border border-red-900/50
                            rounded px-3 py-2 bg-red-950/20">
                                ✕ {errorMsg}
                            </p>
                        )}

                        {/* Submit — 注意这里只有一层三元，不要嵌套 */}
                        <button
                            type="submit"
                            disabled={status === 'sending'}
                            className="w-full py-3 bg-sky-900/30 border border-sky-700 text-brand
                         font-mono text-sm tracking-widest rounded
                         hover:bg-sky-800/40 hover:border-sky-500 hover:text-sky-200
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-200"
                        >
                            {status === 'sending' ? (
                                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border border-sky-400 border-t-transparent
                                   rounded-full animate-spin" />
                                    {t('contact.sending')}
                </span>
                            ) : t('contact.send')}
                        </button>
                    </form>
                )}
            </div>
        </Layout>
    )
}