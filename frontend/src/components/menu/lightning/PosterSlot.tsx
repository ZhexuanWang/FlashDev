import { useState, useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { useAuthStore } from '../../../store/authStore'
import { useHasPermission } from '../../../hooks/usePermissions'
import { useTranslation } from 'react-i18next'

type Area = 'TOP' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT'

interface PosterSlotData {
    id: string
    area: Area
    media: string[]
}

const INTERVAL_MS = 5000

function isVideo(url: string): boolean {
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)
}

interface CarouselProps {
    media: string[]
    current: number
    onPrev: () => void
    onNext: () => void
    isEditing: boolean
    onAddMedia: (urls: string[]) => void
}

function Carousel({ media, current, onPrev, onNext, isEditing, area, onAddMedia }: CarouselProps) {
    const { i18n } = useTranslation()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const lang = i18n.language === 'zh' ? 'zh' : 'en'

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? [])
        if (!files.length) return

        const newUrls: string[] = []
        files.forEach(file => {
            const url = URL.createObjectURL(file)
            newUrls.push(url)
        })
        onAddMedia(newUrls)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    if (media.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="text-slate-600 text-2xl">◈</div>
                <p className="text-slate-600 font-mono text-xs">
                    {isEditing ? (lang === 'zh' ? '点击添加图片或视频' : 'Click to add images or videos') : ''}
                </p>
                {isEditing && (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded border border-sky-800 text-sky-400 font-mono text-[10px]
                                       hover:border-sky-500 hover:text-sky-300 transition-all"
                        >
                            + {lang === 'zh' ? '上传' : 'Upload'}
                        </button>
                    </>
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

            {/* Navigation arrows */}
            {media.length > 1 && (
                <>
                    <button
                        onClick={onPrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
                                   bg-black/50 border border-white/20 text-white/70 font-mono text-sm
                                   hover:bg-black/70 hover:text-white transition-all z-10"
                    >
                        ‹
                    </button>
                    <button
                        onClick={onNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
                                   bg-black/50 border border-white/20 text-white/70 font-mono text-sm
                                   hover:bg-black/70 hover:text-white transition-all z-10"
                    >
                        ›
                    </button>
                </>
            )}

            {/* Indicators */}
            {media.length > 1 && (
                <div className="absolute bottom-2 right-2 flex gap-1.5 z-10">
                    {media.map((_, i) => (
                        <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                                i === current
                                    ? 'bg-white/90'
                                    : 'bg-white/30'
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* Edit mode: upload more */}
            {isEditing && (
                <>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 border border-sky-700
                                   text-sky-400 font-mono text-[10px] hover:bg-black/80 hover:border-sky-500
                                   hover:text-sky-300 transition-all z-10"
                    >
                        + {lang === 'zh' ? '添加' : 'Add'}
                    </button>
                </>
            )}
        </div>
    )
}

interface PosterSlotProps {
    area: Area
}

export function PosterSlot({ area, style }: PosterSlotProps) {
    const { token } = useEditorStore()
    const { role } = useAuthStore()
    const canEdit = useHasPermission('edit_posters')
    const isEditing = !!(token && (role === 'COMPANY' || canEdit))
    const { i18n } = useTranslation()

    const [data, setData] = useState<PosterSlotData | null>(null)
    const [current, setCurrent] = useState(0)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const lang = i18n.language === 'zh' ? 'zh' : 'en'

    const fetchSlot = useCallback(async () => {
        try {
            const res = await fetch('/api/posters')
            if (!res.ok) return
            const slots: PosterSlotData[] = await res.json()
            const slot = slots.find(s => s.area === area)
            if (slot) {
                setData(slot)
                setCurrent(0)
            }
        } catch { /* silently fail */ }
    }, [area])

    useEffect(() => { fetchSlot() }, [fetchSlot])

    // Reset index when media array changes
    useEffect(() => {
        if (data && current >= (data.media?.length ?? 0)) {
            setCurrent(0)
        }
    }, [data?.media])

    // Auto-rotate
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

    const saveMedia = async (media: string[]) => {
        try {
            const res = await fetch(`/api/posters/${area}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ media }),
            })
            if (res.ok) {
                const updated: PosterSlotData = await res.json()
                setData(updated)
                setCurrent(0)
            }
        } catch { /* silently fail */ }
    }

    const addMedia = (urls: string[]) => {
        const newMedia = [...(data?.media ?? []), ...urls]
        saveMedia(newMedia)
    }

    const removeMedia = (index: number) => {
        if (!data?.media) return
        const newMedia = data.media.filter((_, i) => i !== index)
        saveMedia(newMedia)
    }

    return (
        <div className="w-full h-full relative group">
            <Carousel
                media={data?.media ?? []}
                current={current}
                onPrev={prev}
                onNext={next}
                isEditing={isEditing}
                onAddMedia={addMedia}
            />
            {/* Right-click or long-press to remove in edit mode */}
            {isEditing && data?.media && data.media.length > 0 && (
                <button
                    onClick={() => removeMedia(current)}
                    className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 border border-red-800
                               text-red-400 font-mono text-[10px] hover:bg-black/80 hover:border-red-600
                               hover:text-red-300 transition-all z-10 opacity-0 group-hover:opacity-100"
                >
                    ✕ {lang === 'zh' ? '删除' : 'Remove'}
                </button>
            )}
        </div>
    )
}
