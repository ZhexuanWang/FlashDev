import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../store/authStore'
import type { Project } from '../types/project'

function isVideo(url: string): boolean {
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)
}

interface InquiryCarouselProps {
    media: string[]
    current: number
    onPrev: () => void
    onNext: () => void
    isEditing: boolean
    isUploading: boolean
    onUploadClick: () => void
    onRemove: () => void
}

function InquiryCarousel({ media, current, onPrev, onNext, isEditing, isUploading, onUploadClick, onRemove }: InquiryCarouselProps) {
    if (media.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-900/40 rounded-lg border border-slate-800">
                <div className="text-slate-600 text-2xl">◈</div>
                {isEditing && (
                    <button
                        onClick={onUploadClick}
                        disabled={isUploading}
                        className="px-3 py-1.5 rounded border border-sky-800 text-sky-400 font-mono text-[10px]
                                   hover:border-sky-500 hover:text-sky-300 transition-all
                                   disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        + {isUploading ? '...' : 'Upload'}
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="w-full h-full relative overflow-hidden rounded-lg group">
            {media.map((url, i) => (
                <div
                    key={url}
                    className="absolute inset-0 transition-opacity duration-700"
                    style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
                >
                    {isVideo(url)
                        ? <video src={url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                        : <img src={url} alt="" className="w-full h-full object-cover" draggable={false} />
                    }
                </div>
            ))}

            {media.length > 1 && (
                <>
                    <button
                        onClick={onPrev}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full
                                   bg-black/50 border border-white/20 text-white/70 font-mono text-sm
                                   hover:bg-black/70 hover:text-white transition-all z-10 opacity-0 group-hover:opacity-100"
                    >‹</button>
                    <button
                        onClick={onNext}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full
                                   bg-black/50 border border-white/20 text-white/70 font-mono text-sm
                                   hover:bg-black/70 hover:text-white transition-all z-10 opacity-0 group-hover:opacity-100"
                    >›</button>
                </>
            )}

            {isEditing && (
                <>
                    <button
                        onClick={onUploadClick}
                        className="absolute top-1 right-1 px-2 py-0.5 rounded bg-black/60 border border-sky-700
                                   text-sky-400 font-mono text-[10px] hover:bg-black/80 hover:border-sky-500
                                   hover:text-sky-300 transition-all z-10 opacity-0 group-hover:opacity-100"
                    >
                        {isUploading ? '...' : '+'}
                    </button>
                    <button
                        onClick={onRemove}
                        className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-black/60 border border-red-800
                                   text-red-400 font-mono text-[10px] hover:bg-black/80 hover:border-red-600
                                   hover:text-red-300 transition-all z-10 opacity-0 group-hover:opacity-100"
                    >✕</button>
                </>
            )}
        </div>
    )
}

interface InquirySectionProps {
    project: Project
}

export function InquirySection({ project }: InquirySectionProps) {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const { token } = useEditorStore()
    const { role } = useAuthStore()
    const isLoggedIn = !!(token && role)

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState(
        `${lang === 'zh' ? '关于项目' : 'Regarding project'}: ${project.title[lang]}\n${project.description[lang]}\n\n`
    )
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')

    // ── Inquiry carousel ──────────────────────────────────────────
    const [carouselMedia, setCarouselMedia] = useState<string[]>([])
    const [current, setCurrent] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const fetchCarousel = useCallback(async () => {
        try {
            const res = await fetch('/api/posters')
            if (!res.ok) return
            const slots: { area: string; media: string[] }[] = await res.json()
            const slot = slots.find(s => s.area === 'INQUIRY')
            if (slot) setCarouselMedia(slot.media ?? [])
        } catch { /* silently fail */ }
    }, [])

    useEffect(() => { fetchCarousel() }, [fetchCarousel])

    useEffect(() => {
        if (!carouselMedia || carouselMedia.length <= 1) {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
            return
        }
        timerRef.current = setInterval(() => {
            setCurrent(prev => (prev + 1) % carouselMedia.length)
        }, 5000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [carouselMedia])

    const prev = () => {
        if (!carouselMedia?.length) return
        setCurrent(c => (c - 1 + carouselMedia.length) % carouselMedia.length)
    }

    const next = () => {
        if (!carouselMedia?.length) return
        setCurrent(c => (c + 1) % carouselMedia.length)
    }

    const saveMedia = async (media: string[]) => {
        try {
            const res = await fetch('/api/posters/INQUIRY', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ media }),
            })
            if (res.ok) setCarouselMedia(media)
        } catch { /* silently fail */ }
    }

    const handleFileUpload = async (files: FileList | null) => {
        if (!files?.length || !token) return
        setIsUploading(true)
        try {
            const formData = new FormData()
            Array.from(files).forEach(file => formData.append('files', file))
            const res = await fetch('/api/posters/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            })
            if (!res.ok) throw new Error('Upload failed')
            const { urls }: { urls: string[] } = await res.json()
            const newMedia = [...(carouselMedia ?? []), ...urls]
            setCurrent(0)
            await saveMedia(newMedia)
        } catch { /* silently fail */ }
        finally { setIsUploading(false) }
    }

    const removeMedia = () => {
        if (!carouselMedia?.length) return
        const newMedia = carouselMedia.filter((_, i) => i !== current)
        setCurrent(Math.max(0, current - 1))
        saveMedia(newMedia)
    }

    // ── Email sending (same logic as ContactPage) ───────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSending(true)
        setError('')
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    subject: `[Project Inquiry] ${project.title[lang]}`,
                    message: [
                        `Project: ${project.title[lang]}`,
                        `Description: ${project.description[lang]}`,
                        '',
                        `From: ${name} <${email}>`,
                        message ? `\nMessage:\n${message}` : '',
                    ].filter(Boolean).join('\n'),
                }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(
                    Array.isArray(data?.message)
                        ? data.message.join(', ')
                        : data?.message ?? (lang === 'zh' ? '发送失败' : 'Failed to send')
                )
            }
            setSent(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : (lang === 'zh' ? '发送失败' : 'Failed to send'))
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="border-t border-slate-800 pt-8 mt-8">
            <div className="grid grid-cols-[2fr_1fr] gap-6 items-stretch">
                {/* ── Left: Inquiry form ── */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 flex flex-col">
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
                        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col flex-1">
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
                                    <label className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">Email</label>
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

                            <div className="space-y-1 flex-1">
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
                                               focus:outline-none focus:border-sky-700 transition-all flex-1"
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

                {/* ── Right: Inquiry carousel ── */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 flex flex-col">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={e => handleFileUpload(e.target.files)}
                    />
                    <div className="flex-1 min-h-0 flex items-center">
                        <div className="w-full aspect-square bg-slate-900 rounded-lg overflow-hidden">
                            <InquiryCarousel
                                media={carouselMedia}
                                current={current}
                                onPrev={prev}
                                onNext={next}
                                isEditing={isLoggedIn}
                                isUploading={isUploading}
                                onUploadClick={() => isLoggedIn && fileInputRef.current?.click()}
                                onRemove={removeMedia}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
