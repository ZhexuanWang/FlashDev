import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../store/authStore'
import type { Project } from '../types/project'

interface InquiryFormProps {
    project: Project
}

export function InquiryForm({ project }: InquiryFormProps) {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const { token } = useEditorStore()
    const { role } = useAuthStore()
    const isLoggedIn = !!(token && role)

    const [showLogin, setShowLogin] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState(
        `${lang === 'zh' ? '关于项目' : 'Regarding project'}: ${project.title[lang]}\n${project.description[lang]}\n\n`
    )
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token) return
        setSending(true)
        setError('')
        try {
            const res = await fetch(`/api/projects/${project.id}/blocks/inquiry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name, email, message }),
            })
            const data = await res.json()
            if (data.success) {
                setSent(true)
            } else {
                setError(data?.message ?? 'Failed to send')
            }
        } catch {
            setError('Network error')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="border-t border-slate-800 pt-8 mt-8">
            <div className="mx-auto bg-slate-900/60 border border-slate-800 rounded-lg p-6 max-w-xl">
                <h3 className="text-slate-300 font-mono text-sm mb-4 tracking-widest">
                    {lang === 'zh' ? '项目咨询' : 'Project Inquiry'}
                </h3>

                {sent ? (
                    <div className="text-center py-6 space-y-3">
                        <div className="text-emerald-400 text-2xl">✓</div>
                        <p className="text-slate-400 font-mono text-xs">
                            {lang === 'zh' ? '咨询已发送，我们会尽快回复。' : 'Inquiry sent. We will get back to you soon.'}
                        </p>
                    </div>
                ) : !isLoggedIn ? (
                    <div className="space-y-4">
                        <p className="text-slate-500 font-mono text-xs leading-relaxed">
                            {lang === 'zh'
                                ? '登录后即可发送项目咨询，我们会将您的咨询内容和项目信息一同发送给公司。'
                                : 'Log in to send a project inquiry. Your message and project details will be sent to the company.'}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/login')}
                                className="px-4 py-2 bg-sky-900/40 border border-sky-700 text-sky-400 font-mono text-xs rounded
                                           hover:bg-sky-800/40 hover:border-sky-500 hover:text-sky-300 transition-all"
                            >
                                {lang === 'zh' ? '登录' : 'Login'}
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-4 py-2 border border-slate-700 text-slate-500 font-mono text-xs rounded
                                           hover:border-slate-600 hover:text-slate-300 transition-all"
                            >
                                {lang === 'zh' ? '注册' : 'Register'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                                    {lang === 'zh' ? '姓名' : 'Name'}
                                </label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    placeholder={lang === 'zh' ? '您的姓名' : 'Your name'}
                                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2
                                               text-slate-200 text-sm font-mono placeholder:text-slate-600
                                               focus:outline-none focus:border-sky-700 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    placeholder="your@email.com"
                                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2
                                               text-slate-200 text-sm font-mono placeholder:text-slate-600
                                               focus:outline-none focus:border-sky-700 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">
                                {lang === 'zh' ? '留言' : 'Message'}
                            </label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={5}
                                required
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2
                                           text-slate-200 text-sm font-mono placeholder:text-slate-600 resize-none
                                           focus:outline-none focus:border-sky-700 transition-all"
                            />
                        </div>

                        {error && (
                            <p className="text-red-500/80 font-mono text-xs">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full py-2.5 bg-sky-900/40 border border-sky-700 text-sky-400 font-mono text-xs rounded
                                       hover:bg-sky-800/40 hover:border-sky-500 hover:text-sky-300 transition-all
                                       disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {sending
                                ? (lang === 'zh' ? '发送中...' : 'Sending...')
                                : (lang === 'zh' ? '发送咨询' : 'Send Inquiry')
                            }
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
