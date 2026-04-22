import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEditorStore } from '../../../store/editorStore'
import { useAuthStore } from '../../../store/authStore'
import { useHasPermission } from '../../../hooks/usePermissions'
import { useTranslation } from 'react-i18next'

type Area = 'TOP' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT'

interface PosterSlotData {
    id: string
    area: Area
    media: string[]
    links: string[]
}

const INTERVAL_MS = 5000

function isVideo(url: string): boolean {
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)
}

function isInternalLink(url: string): boolean {
    return url.startsWith('/') || url.startsWith('#')
}

interface CarouselProps {
    media: string[]
    links: string[]
    current: number
    onPrev: () => void
    onNext: () => void
    onSlideSelect: (i: number) => void
    isEditing: boolean
    isUploading: boolean
    onUploadClick: () => void
}

function Carousel({
    media, links, current, onPrev, onNext, onSlideSelect,
    isEditing, isUploading, onUploadClick,
}: CarouselProps) {
    const { i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const navigate = useNavigate()

    const currentLink = links[current] ?? ''

    const handleMediaClick = () => {
        if (isEditing) {
            onSlideSelect(current)
            return
        }
        if (currentLink) {
            if (isInternalLink(currentLink)) {
                navigate(currentLink)
            } else {
                window.open(currentLink, '_blank', 'noopener,noreferrer')
            }
        }
    }

    if (media.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="text-slate-600 text-2xl">◈</div>
                <p className="text-slate-600 font-mono text-xs">
                    {isUploading ? (lang === 'zh' ? '上传中...' : 'Uploading...') : ''}
                </p>
                {isEditing && (
                    <button
                        onClick={onUploadClick}
                        disabled={isUploading}
                        className="px-3 py-1.5 rounded border border-sky-800 text-sky-400 font-mono text-[10px]
                                   hover:border-sky-500 hover:text-sky-300 transition-all
                                   disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        + {lang === 'zh' ? '上传' : 'Upload'}
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="w-full h-full relative overflow-hidden rounded-lg">
            {/* Media */}
            {media.map((url, i) => (
                <div
                    key={url}
                    className="absolute inset-0 transition-opacity duration-700"
                    style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
                >
                    {isVideo(url) ? (
                        <video
                            src={url}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                    ) : (
                        <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                            draggable={false}
                        />
                    )}
                </div>
            ))}

            {/* Clickable overlay — link indicator or cursor */}
            {(currentLink || isEditing) && (
                <button
                    onClick={handleMediaClick}
                    className={`absolute inset-0 z-10 transition-opacity ${
                        isEditing ? 'opacity-0 hover:opacity-100 cursor-pointer' : 'opacity-0 hover:opacity-100'
                    }`}
                    title={currentLink || (lang === 'zh' ? '点击设置链接' : 'Click to set link')}
                >
                    {currentLink && !isEditing && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 border border-sky-700
                                        text-sky-400 font-mono text-[10px]">
                            🔗 {currentLink.length > 20 ? currentLink.slice(0, 20) + '…' : currentLink}
                        </div>
                    )}
                </button>
            )}

            {/* Navigation arrows */}
            {media.length > 1 && (
                <>
                    <button
                        onClick={onPrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
                                   bg-black/50 border border-white/20 text-white/70 font-mono text-sm
                                   hover:bg-black/70 hover:text-white transition-all z-20"
                    >
                        ‹
                    </button>
                    <button
                        onClick={onNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
                                   bg-black/50 border border-white/20 text-white/70 font-mono text-sm
                                   hover:bg-black/70 hover:text-white transition-all z-20"
                    >
                        ›
                    </button>
                </>
            )}

            {/* Indicators with link dots */}
            {media.length > 1 && (
                <div className="absolute bottom-2 right-2 flex gap-1.5 z-20">
                    {media.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => onSlideSelect(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-all
                                ${i === current ? 'bg-white/90' : 'bg-white/30 hover:bg-white/50'}
                                ${links[i] ? 'ring-1 ring-sky-400/50' : ''}`}
                        />
                    ))}
                </div>
            )}

            {/* Edit mode: upload more */}
            {isEditing && (
                <button
                    onClick={onUploadClick}
                    disabled={isUploading}
                    className="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 border border-sky-700
                               text-sky-400 font-mono text-[10px] hover:bg-black/80 hover:border-sky-500
                               hover:text-sky-300 transition-all z-20
                               disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isUploading ? '...' : '+'}
                </button>
            )}
        </div>
    )
}

interface PosterSlotProps {
    area: Area
}

export function PosterSlot({ area }: PosterSlotProps) {
    const { token } = useEditorStore()
    const { role } = useAuthStore()
    const canEdit = useHasPermission('edit_posters')
    const isEditing = !!(token && (role === 'COMPANY' || canEdit))
    const { i18n } = useTranslation()

    const [data, setData] = useState<PosterSlotData | null>(null)
    const [current, setCurrent] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const [showLinkEditor, setShowLinkEditor] = useState(false)
    const [linkInput, setLinkInput] = useState('')
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const lang = i18n.language === 'zh' ? 'zh' : 'en'

    const fetchSlot = useCallback(async () => {
        try {
            const res = await fetch('/api/posters')
            if (!res.ok) return
            const slots: PosterSlotData[] = await res.json()
            const slot = slots.find(s => s.area === area)
            if (slot) {
                setData({ ...slot, links: slot.links ?? [] })
                setCurrent(0)
            }
        } catch { /* silently fail */ }
    }, [area])

    useEffect(() => { fetchSlot() }, [fetchSlot])

    useEffect(() => {
        if (data && current >= (data.media?.length ?? 0)) {
            setCurrent(0)
        }
    }, [data?.media])

    useEffect(() => {
        if (!data || !data.media || data.media.length <= 1) {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
            return
        }
        timerRef.current = setInterval(() => {
            setCurrent(prev => (prev + 1) % data.media.length)
        }, INTERVAL_MS)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [data])

    const prev = () => {
        if (!data?.media?.length) return
        setCurrent(c => (c - 1 + data.media.length) % data.media.length)
        resetTimer()
    }

    const next = () => {
        if (!data?.media?.length) return
        setCurrent(c => (c + 1) % data.media.length)
        resetTimer()
    }

    const resetTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        if (!data?.media || data.media.length <= 1) return
        timerRef.current = setInterval(() => {
            setCurrent(prev => (prev + 1) % data.media.length)
        }, INTERVAL_MS)
    }

    const saveMedia = async (media: string[], links: string[]) => {
        try {
            const res = await fetch(`/api/posters/${area}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ media, links }),
            })
            if (res.ok) {
                const updated: PosterSlotData = await res.json()
                setData({ ...updated, links: updated.links ?? [] })
                setCurrent(0)
            }
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

            const newMedia = [...(data?.media ?? []), ...urls]
            const newLinks = [...(data?.links ?? []), ...urls.map(() => '')]
            saveMedia(newMedia, newLinks)
        } catch {
            /* silently fail */
        } finally {
            setIsUploading(false)
        }
    }

    const removeMedia = (index: number) => {
        if (!data?.media) return
        const newMedia = data.media.filter((_, i) => i !== index)
        const newLinks = data.links.filter((_, i) => i !== index)
        saveMedia(newMedia, newLinks)
    }

    const openLinkEditor = (index: number) => {
        setCurrent(index)
        setLinkInput(data?.links?.[index] ?? '')
        setShowLinkEditor(true)
    }

    const saveLink = () => {
        if (!data?.media) return
        const newLinks = [...(data.links ?? [])]
        newLinks[current] = linkInput.trim()
        saveMedia(data.media, newLinks)
        setShowLinkEditor(false)
    }

    return (
        <div className="w-full h-full relative group">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={e => handleFileUpload(e.target.files)}
            />

            <Carousel
                media={data?.media ?? []}
                links={data?.links ?? []}
                current={current}
                onPrev={prev}
                onNext={next}
                onSlideSelect={(i) => {
                    if (isEditing) openLinkEditor(i)
                }}
                isEditing={isEditing}
                isUploading={isUploading}
                onUploadClick={() => isEditing && fileInputRef.current?.click()}
            />

            {/* Remove button in edit mode */}
            {isEditing && data?.media && data.media.length > 0 && (
                <button
                    onClick={() => removeMedia(current)}
                    className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 border border-red-800
                               text-red-400 font-mono text-[10px] hover:bg-black/80 hover:border-red-600
                               hover:text-red-300 transition-all z-20 opacity-0 group-hover:opacity-100"
                >
                    ✕ {lang === 'zh' ? '删除' : 'Remove'}
                </button>
            )}

            {/* Set link button in edit mode */}
            {isEditing && data?.media && data.media.length > 0 && (
                <button
                    onClick={() => openLinkEditor(current)}
                    className="absolute top-2 left-2 px-2 py-1 rounded bg-black/60 border border-sky-700
                               text-sky-400 font-mono text-[10px] hover:bg-black/80 hover:border-sky-500
                               hover:text-sky-300 transition-all z-20 opacity-0 group-hover:opacity-100"
                >
                    🔗 {lang === 'zh' ? '链接' : 'Link'}
                </button>
            )}

            {/* Link editor modal */}
            {showLinkEditor && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowLinkEditor(false)}>
                    <div className="w-64 bg-slate-900 border border-sky-700 rounded p-3 space-y-2"
                        onClick={e => e.stopPropagation()}>
                        <div className="text-sky-400 font-mono text-[10px] mb-1">
                            {lang === 'zh' ? `第 ${current + 1} 张图片链接` : `Link for slide ${current + 1}`}
                        </div>
                        <input
                            value={linkInput}
                            onChange={e => setLinkInput(e.target.value)}
                            placeholder={lang === 'zh' ? '/projects, https://...' : '/projects, https://...'}
                            className="w-full bg-slate-900/80 border border-slate-700 rounded px-2 py-1.5
                                       text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-600"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setShowLinkEditor(false)}
                                className="flex-1 py-1 border border-slate-700 text-slate-500 font-mono text-[10px] rounded hover:border-slate-600">
                                {lang === 'zh' ? '取消' : 'Cancel'}
                            </button>
                            <button onClick={saveLink}
                                className="flex-1 py-1 bg-sky-900/40 border border-sky-700 text-sky-400 font-mono text-[10px] rounded hover:border-sky-500">
                                {lang === 'zh' ? '保存' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
