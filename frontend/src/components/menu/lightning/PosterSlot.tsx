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
const TOP_INTERVAL_MS = INTERVAL_MS + 1500

function isVideo(url: string): boolean {
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)
}

function isInternalLink(url: string): boolean {
    return url.startsWith('/') || url.startsWith('#')
}

// ─────────────────────────────────────────────
// Single-slide Carousel (for BOTTOM areas)
// ─────────────────────────────────────────────
function SingleCarousel({ media, links, area, onDelete, onUpload, onSaveLinks, intervalMs = INTERVAL_MS }: {
    media: string[]
    links: string[]
    area: Area
    onDelete?: () => void
    onUpload?: () => void
    onSaveLinks?: (links: string[]) => void
    intervalMs?: number
}) {
    const { i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const navigate = useNavigate()
    const [current, setCurrent] = useState(0)
    const [showLinkModal, setShowLinkModal] = useState(false)
    const [linkIdx, setLinkIdx] = useState(0)
    const [linkVal, setLinkVal] = useState('')
    const [linkSaving, setLinkSaving] = useState(false)
    const { token } = useEditorStore()
    const { role } = useAuthStore()
    const canEdit = useHasPermission('edit_posters')
    const isEditing = !!(token && (role === 'COMPANY' || canEdit))
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const currentLink = links[current] ?? ''

    const prev = () => setCurrent(c => c === 0 ? media.length - 1 : c - 1)
    const next = () => setCurrent(c => (c + 1) % media.length)

    useEffect(() => {
        if (media.length <= 1) return
        timerRef.current = setInterval(next, intervalMs)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [media.length, intervalMs])

    const handleMediaClick = () => {
        if (!currentLink) return
        if (isInternalLink(currentLink)) navigate(currentLink)
        else window.open(currentLink, '_blank', 'noopener,noreferrer')
    }

    const openLinkModal = () => {
        setLinkIdx(current)
        setLinkVal(links[current] ?? '')
        setShowLinkModal(true)
    }

    const saveLink = () => {
        setLinkSaving(true)
        const newLinks = [...links]
        newLinks[linkIdx] = linkVal.trim()
        onSaveLinks?.(newLinks)
        setShowLinkModal(false)
        setLinkSaving(false)
    }

    if (media.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/40 rounded-lg border border-slate-800 group">
                <span className="text-slate-600 text-2xl">◈</span>
                {isEditing && (
                    <button onClick={onUpload}
                        className="mt-2 px-3 py-1.5 rounded border border-sky-800 text-sky-400 font-mono text-[10px] hover:border-sky-500 transition-all opacity-0 group-hover:opacity-100">
                        + {lang === 'zh' ? '上传' : 'Upload'}
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="w-full h-full relative overflow-hidden rounded-lg group">
            {media.map((url, i) => (
                <div key={url} className="absolute inset-0 transition-opacity duration-700"
                    style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}>
                    {isVideo(url)
                        ? <video src={url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                        : <img src={url} alt="" className="w-full h-full object-cover" draggable={false} />
                    }
                </div>
            ))}
            {currentLink && !isEditing && (
                <button onClick={handleMediaClick} className="absolute inset-0 z-10 opacity-0 hover:opacity-100" />
            )}
            {media.length > 1 && (
                <>
                    <button onClick={prev} className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/50 border border-white/20 text-white/70 font-mono text-xs hover:bg-black/70 z-20 opacity-0 group-hover:opacity-100 transition-opacity">‹</button>
                    <button onClick={next} className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/50 border border-white/20 text-white/70 font-mono text-xs hover:bg-black/70 z-20 opacity-0 group-hover:opacity-100 transition-opacity">›</button>
                    <div className="absolute bottom-1.5 right-1.5 flex gap-1 z-20">
                        {media.map((_, i) => (
                            <div key={i} className={`w-1 h-1 rounded-full ${i === current ? 'bg-white/90' : 'bg-white/30'}`} />
                        ))}
                    </div>
                </>
            )}
            {/* Edit mode buttons — shown on hover */}
            {isEditing && (
                <div className="absolute top-1 right-1 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onDelete && (
                        <button onClick={onDelete}
                            className="px-2 py-1 rounded bg-black/70 border border-red-900 text-red-400 font-mono text-[10px] hover:border-red-700">
                            ✕
                        </button>
                    )}
                    {onUpload && (
                        <button onClick={onUpload}
                            className="px-2 py-1 rounded bg-black/70 border border-sky-700 text-sky-400 font-mono text-[10px] hover:border-sky-500">
                            +
                        </button>
                    )}
                    {media.length > 0 && onSaveLinks && (
                        <button onClick={openLinkModal}
                            className="px-2 py-1 rounded bg-black/70 border border-sky-700 text-sky-400 font-mono text-[10px] hover:border-sky-500">
                            🔗
                        </button>
                    )}
                </div>
            )}
            {showLinkModal && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowLinkModal(false)}>
                    <div className="w-56 bg-slate-900 border border-sky-700 rounded p-3 space-y-2" onClick={e => e.stopPropagation()}>
                        <div className="text-sky-400 font-mono text-[10px]">{lang === 'zh' ? '跳转链接' : 'Link'}</div>
                        <input value={linkVal} onChange={e => setLinkVal(e.target.value)}
                            placeholder="/projects, https://..."
                            className="w-full bg-slate-900/80 border border-slate-700 rounded px-2 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-600" />
                        <div className="flex gap-2">
                            <button onClick={() => setShowLinkModal(false)}
                                className="flex-1 py-1 border border-slate-700 text-slate-500 font-mono text-[10px] rounded hover:border-slate-600">
                                {lang === 'zh' ? '取消' : 'Cancel'}
                            </button>
                            <button onClick={saveLink} disabled={linkSaving}
                                className="flex-1 py-1 bg-sky-900/40 border border-sky-700 text-sky-400 font-mono text-[10px] rounded hover:border-sky-500 disabled:opacity-40">
                                {linkSaving ? '...' : (lang === 'zh' ? '保存' : 'Save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// TOP area: two SingleCarousel panels side by side
// ─────────────────────────────────────────────
function TopAreaSplit({
    media, links, isEditing, onSaveLeft, onSaveRight, onUploadLeft, onUploadRight,
    onDeleteLeft, onDeleteRight,
}: {
    media: string[]
    links: string[]
    isEditing: boolean
    onSaveLeft: (links: string[]) => void
    onSaveRight: (links: string[]) => void
    onUploadLeft: () => void
    onUploadRight: () => void
    onDeleteLeft: () => void
    onDeleteRight: () => void
}) {
    const mid = Math.ceil(media.length / 2)
    const leftMedia = media.slice(0, mid)
    const rightMedia = media.slice(mid)
    const leftLinks = links.slice(0, mid)
    const rightLinks = links.slice(mid)

    return (
        <div className="w-full h-full flex gap-1 rounded-lg overflow-hidden">
            <div className="flex-1 min-w-0">
                <PanelCarousel
                    media={leftMedia}
                    links={leftLinks}
                    isEditing={isEditing}
                    onUpload={onUploadLeft}
                    onDelete={leftMedia.length > 0 ? onDeleteLeft : undefined}
                    onSave={onSaveLeft}
                    panelLabel="L"
                />
            </div>
            <div className="flex-1 min-w-0">
                <PanelCarousel
                    media={rightMedia}
                    links={rightLinks}
                    isEditing={isEditing}
                    onUpload={onUploadRight}
                    onDelete={rightMedia.length > 0 ? onDeleteRight : undefined}
                    onSave={onSaveRight}
                    panelLabel="R"
                />
            </div>
        </div>
    )
}

// Single carousel panel for split top area
function PanelCarousel({
    media, links, isEditing, onUpload, onDelete, onSave, panelLabel,
}: {
    media: string[]
    links: string[]
    isEditing: boolean
    onUpload: () => void
    onDelete?: () => void
    onSave: (links: string[]) => void
    panelLabel: string
}) {
    const { i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const navigate = useNavigate()
    const [current, setCurrent] = useState(0)
    const [showLinkModal, setShowLinkModal] = useState(false)
    const [linkIdx, setLinkIdx] = useState(0)
    const [linkVal, setLinkVal] = useState('')
    const [linkSaving, setLinkSaving] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const safeLen = Math.max(1, media.length)
    const prev = () => setCurrent(c => c === 0 ? safeLen - 1 : c - 1)
    const next = () => setCurrent(c => (c + 1) % safeLen)

    const currentLink = links[current] ?? ''

    useEffect(() => {
        if (safeLen <= 1) return
        timerRef.current = setInterval(next, TOP_INTERVAL_MS)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [safeLen])

    const handleMediaClick = () => {
        if (!currentLink) return
        if (isInternalLink(currentLink)) navigate(currentLink)
        else window.open(currentLink, '_blank', 'noopener,noreferrer')
    }

    const openLinkModal = () => {
        setLinkIdx(current)
        setLinkVal(links[current] ?? '')
        setShowLinkModal(true)
    }

    const saveLink = () => {
        setLinkSaving(true)
        const newLinks = [...links]
        newLinks[linkIdx] = linkVal.trim()
        onSave(newLinks)
        setShowLinkModal(false)
        setLinkSaving(false)
    }

    if (media.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/40 rounded-lg border border-slate-800">
                <span className="text-slate-600 text-2xl">◈</span>
                {isEditing && (
                    <button onClick={onUpload}
                        className="mt-2 px-3 py-1.5 rounded border border-sky-800 text-sky-400 font-mono text-[10px] hover:border-sky-500 transition-all">
                        + {lang === 'zh' ? '上传' : 'Upload'}
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="w-full h-full relative overflow-hidden rounded-lg group">
            {media.map((url, i) => (
                <div key={url} className="absolute inset-0 transition-opacity duration-700"
                    style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}>
                    {isVideo(url)
                        ? <video src={url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                        : <img src={url} alt="" className="w-full h-full object-cover" draggable={false} />
                    }
                </div>
            ))}
            {currentLink && !isEditing && (
                <button onClick={handleMediaClick} className="absolute inset-0 z-10 opacity-0 hover:opacity-100" />
            )}
            {media.length > 1 && (
                <>
                    <button onClick={prev} className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/50 border border-white/20 text-white/70 font-mono text-xs hover:bg-black/70 z-20 opacity-0 group-hover:opacity-100 transition-opacity">‹</button>
                    <button onClick={next} className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/50 border border-white/20 text-white/70 font-mono text-xs hover:bg-black/70 z-20 opacity-0 group-hover:opacity-100 transition-opacity">›</button>
                    <div className="absolute bottom-1 right-1 flex gap-1 z-20">
                        {media.map((_, i) => (
                            <div key={i} className={`w-1 h-1 rounded-full ${i === current ? 'bg-white/90' : 'bg-white/30'}`} />
                        ))}
                    </div>
                </>
            )}
            {isEditing && (
                <div className="absolute top-1 right-1 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onDelete && (
                        <button onClick={onDelete}
                            className="px-2 py-1 rounded bg-black/70 border border-red-900 text-red-400 font-mono text-[10px] hover:border-red-700">
                            ✕
                        </button>
                    )}
                    <button onClick={onUpload}
                        className="px-2 py-1 rounded bg-black/70 border border-sky-700 text-sky-400 font-mono text-[10px] hover:border-sky-500">
                        +
                    </button>
                    {media.length > 0 && (
                        <button onClick={openLinkModal}
                            className="px-2 py-1 rounded bg-black/70 border border-sky-700 text-sky-400 font-mono text-[10px] hover:border-sky-500">
                            🔗
                        </button>
                    )}
                </div>
            )}
            {showLinkModal && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowLinkModal(false)}>
                    <div className="w-56 bg-slate-900 border border-sky-700 rounded p-3 space-y-2" onClick={e => e.stopPropagation()}>
                        <div className="text-sky-400 font-mono text-[10px]">{lang === 'zh' ? '跳转链接' : 'Link'}</div>
                        <input value={linkVal} onChange={e => setLinkVal(e.target.value)}
                            placeholder="/projects, https://..."
                            className="w-full bg-slate-900/80 border border-slate-700 rounded px-2 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-600" />
                        <div className="flex gap-2">
                            <button onClick={() => setShowLinkModal(false)}
                                className="flex-1 py-1 border border-slate-700 text-slate-500 font-mono text-[10px] rounded hover:border-slate-600">
                                {lang === 'zh' ? '取消' : 'Cancel'}
                            </button>
                            <button onClick={saveLink} disabled={linkSaving}
                                className="flex-1 py-1 bg-sky-900/40 border border-sky-700 text-sky-400 font-mono text-[10px] rounded hover:border-sky-500 disabled:opacity-40">
                                {linkSaving ? '...' : (lang === 'zh' ? '保存' : 'Save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// PosterSlot component
// ─────────────────────────────────────────────
export function PosterSlot({ area }: PosterSlotProps) {
    const { token } = useEditorStore()
    const { role } = useAuthStore()
    const canEdit = useHasPermission('edit_posters')
    const isEditing = !!(token && (role === 'COMPANY' || canEdit))
    const { i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'

    const [data, setData] = useState<PosterSlotData | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputLeft = useRef<HTMLInputElement>(null)
    const fileInputRight = useRef<HTMLInputElement>(null)

    const fetchSlot = useCallback(async () => {
        try {
            const res = await fetch('/api/posters')
            if (!res.ok) return
            const slots: PosterSlotData[] = await res.json()
            const slot = slots.find(s => s.area === area)
            if (slot) setData({ ...slot, links: slot.links ?? [] })
        } catch { /* silently fail */ }
    }, [area])

    useEffect(() => { fetchSlot() }, [fetchSlot])

    const saveMedia = async (media: string[], links: string[]) => {
        if (!token) return
        try {
            const res = await fetch(`/api/posters/${area}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ media, links }),
            })
            if (res.ok) {
                const updated: PosterSlotData = await res.json()
                setData({ ...updated, links: updated.links ?? [] })
            }
        } catch { /* silently fail */ }
    }

    const handleFileUpload = async (files: FileList | null, target: 'left' | 'right') => {
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
            if (!res.ok) throw new Error()
            const { urls }: { urls: string[] } = await res.json()
            const existing = data?.media ?? []
            const mid = Math.ceil(existing.length / 2)
            if (target === 'left') {
                // Replace left panel with new uploads
                const leftMedia = [...urls, ...existing.slice(0, mid)]
                const rightMedia = existing.slice(mid)
                saveMedia([...leftMedia, ...rightMedia], data?.links ?? [])
            } else {
                // Append to right panel
                const leftMedia = existing.slice(0, mid)
                const rightMedia = [...existing.slice(mid), ...urls]
                saveMedia([...leftMedia, ...rightMedia], data?.links ?? [])
            }
        } catch { /* silently fail */ }
        finally { setIsUploading(false) }
    }

    const removeMedia = (index: number) => {
        if (!data?.media) return
        const newMedia = data.media.filter((_, i) => i !== index)
        const newLinks = data.links.filter((_, i) => i !== index)
        saveMedia(newMedia, newLinks)
    }

    const isLarge = area === 'TOP'
    const currentMedia = data?.media ?? []

    return (
        <div className="w-full h-full relative group">
            <input ref={fileInputLeft} type="file" accept="image/*,video/*" multiple
                className="hidden" onChange={e => handleFileUpload(e.target.files, 'left')} />
            <input ref={fileInputRight} type="file" accept="image/*,video/*" multiple
                className="hidden" onChange={e => handleFileUpload(e.target.files, 'right')} />

            {isLarge ? (
                <TopAreaSplit
                    media={currentMedia}
                    links={data?.links ?? []}
                    isEditing={isEditing}
                    onSaveLeft={(leftLinks) => {
                        const rightLinks = (data?.links ?? []).slice(Math.ceil(currentMedia.length / 2))
                        saveMedia(currentMedia, [...leftLinks, ...rightLinks])
                    }}
                    onSaveRight={(rightLinks) => {
                        const leftLinks = (data?.links ?? []).slice(0, Math.ceil(currentMedia.length / 2))
                        saveMedia(currentMedia, [...leftLinks, ...rightLinks])
                    }}
                    onUploadLeft={() => { if (isEditing) fileInputLeft.current?.click() }}
                    onUploadRight={() => { if (isEditing) fileInputRight.current?.click() }}
                    onDeleteLeft={() => {
                        const mid = Math.ceil(currentMedia.length / 2)
                        const remaining = currentMedia.slice(mid)
                        const newLinks = (data?.links ?? []).slice(mid)
                        saveMedia(remaining, newLinks)
                    }}
                    onDeleteRight={() => {
                        const mid = Math.ceil(currentMedia.length / 2)
                        const remaining = currentMedia.slice(0, mid)
                        const newLinks = (data?.links ?? []).slice(0, mid)
                        saveMedia(remaining, newLinks)
                    }}
                />
            ) : (
                <SingleCarousel
                    media={currentMedia}
                    links={data?.links ?? []}
                    area={area}
                    onDelete={() => removeMedia(0)}
                    onUpload={() => { if (isEditing) fileInputLeft.current?.click() }}
                    onSaveLinks={(newLinks) => saveMedia(currentMedia, newLinks)}
                />
            )}
        </div>
    )
}

type PosterSlotProps = { area: Area }
