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

// ─────────────────────────────────────────────
// Single-slide Carousel (for BOTTOM areas)
// ─────────────────────────────────────────────
function SingleCarousel({ media, links, area }: {
    media: string[]
    links: string[]
    area: Area
}) {
    const { i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const navigate = useNavigate()
    const [current, setCurrent] = useState(0)
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
        timerRef.current = setInterval(next, INTERVAL_MS)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [media.length])

    const handleMediaClick = () => {
        if (!currentLink) return
        if (isInternalLink(currentLink)) navigate(currentLink)
        else window.open(currentLink, '_blank', 'noopener,noreferrer')
    }

    if (media.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <span className="text-slate-600 text-2xl">◈</span>
            </div>
        )
    }

    return (
        <div className="w-full h-full relative overflow-hidden rounded-lg">
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
                    <button onClick={prev} className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/50 border border-white/20 text-white/70 font-mono text-xs hover:bg-black/70 z-20">‹</button>
                    <button onClick={next} className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/50 border border-white/20 text-white/70 font-mono text-xs hover:bg-black/70 z-20">›</button>
                    <div className="absolute bottom-1.5 right-1.5 flex gap-1 z-20">
                        {media.map((_, i) => (
                            <div key={i} className={`w-1 h-1 rounded-full ${i === current ? 'bg-white/90' : 'bg-white/30'}`} />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// Large multi-row vertical scroll Carousel (TOP area)
// ─────────────────────────────────────────────
function LargeCarousel({ media, links, isEditing, onSave, onUploadClick }: {
    media: string[]
    links: string[]
    isEditing: boolean
    onSave: (links: string[]) => void
    onUploadClick: () => void
}) {
    const { i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const navigate = useNavigate()
    const scrollRef = useRef<HTMLDivElement>(null)
    const [activeRow, setActiveRow] = useState(0)
    const [showLinkModal, setShowLinkModal] = useState(false)
    const [linkIdx, setLinkIdx] = useState(0)
    const [linkVal, setLinkVal] = useState('')
    const [linkSaving, setLinkSaving] = useState(false)

    const COLS = 3
    const rows: string[][] = []
    for (let i = 0; i < media.length; i += COLS) {
        rows.push(media.slice(i, i + COLS))
    }

    const handleMediaClick = (idx: number) => {
        if (isEditing) { setLinkIdx(idx); setLinkVal(links[idx] ?? ''); setShowLinkModal(true); return }
        const link = links[idx]
        if (!link) return
        if (isInternalLink(link)) navigate(link)
        else window.open(link, '_blank', 'noopener,noreferrer')
    }

    const saveLink = async () => {
        setLinkSaving(true)
        const newLinks = [...links]
        newLinks[linkIdx] = linkVal.trim()
        onSave(newLinks)
        setShowLinkModal(false)
        setLinkSaving(false)
    }

    const openLinkModal = (idx: number) => {
        setLinkIdx(idx); setLinkVal(links[idx] ?? ''); setShowLinkModal(true)
    }

    if (media.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <span className="text-slate-600 text-4xl">◈</span>
                <p className="text-slate-700 font-mono text-xs">{lang === 'zh' ? '暂无内容' : 'No content'}</p>
                {isEditing && (
                    <button onClick={onUploadClick}
                        className="px-3 py-1.5 rounded border border-sky-800 text-sky-400 font-mono text-[10px] hover:border-sky-500 transition-all">
                        + {lang === 'zh' ? '上传媒体' : 'Upload Media'}
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="w-full h-full relative flex flex-col overflow-hidden rounded-lg">

            {/* Rows grid */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto scroll-smooth snap-y snap-mandatory"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(100,100,150,0.3) transparent' }}
            >
                {rows.map((row, rowIdx) => (
                    <div key={rowIdx}
                        className="grid grid-cols-3 gap-0.5 snap-start"
                        style={{ minHeight: 'calc(100% / 3)' }}>
                        {row.map((url, colIdx) => {
                            const globalIdx = rowIdx * COLS + colIdx
                            const link = links[globalIdx] ?? ''
                            const isActive = globalIdx === activeRow
                            return (
                                <div
                                    key={url}
                                    onClick={() => { setActiveRow(globalIdx); handleMediaClick(globalIdx) }}
                                    className={`relative overflow-hidden cursor-pointer group
                                        ${isActive && !isEditing ? 'ring-1 ring-sky-400/40' : ''}
                                        ${link ? 'ring-1 ring-sky-500/30' : ''}`}
                                    style={{ minHeight: '80px' }}>
                                    {isVideo(url)
                                        ? <video src={url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                                        : <img src={url} alt="" className="w-full h-full object-cover" />
                                    }
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
                                    {/* Link indicator */}
                                    {link && (
                                        <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-black/60 border border-sky-700 text-sky-400 font-mono text-[9px]">🔗</div>
                                    )}
                                    {/* Edit controls */}
                                    {isEditing && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                            <button onClick={(e) => { e.stopPropagation(); openLinkModal(globalIdx) }}
                                                className="px-2 py-1 rounded bg-black/70 border border-sky-700 text-sky-400 font-mono text-[9px]">
                                                🔗 {lang === 'zh' ? '链接' : 'Link'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>

            {/* Row indicator */}
            {rows.length > 1 && (
                <div className="absolute bottom-1.5 right-1.5 flex gap-1 z-20">
                    {rows.map((_, i) => (
                        <button key={i} onClick={() => {
                            setActiveRow(i * COLS)
                            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight / rows.length * i, behavior: 'smooth' })
                        }}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${i === Math.floor(activeRow / COLS) ? 'bg-sky-400' : 'bg-white/30 hover:bg-white/60'}`} />
                    ))}
                </div>
            )}

            {/* Edit: upload button */}
            {isEditing && (
                <button onClick={onUploadClick}
                    className="absolute top-1.5 right-1.5 px-2 py-1 rounded bg-black/70 border border-sky-700 text-sky-400 font-mono text-[10px] hover:border-sky-500 z-20 transition-all">
                    + {lang === 'zh' ? '添加' : 'Add'}
                </button>
            )}

            {/* Link modal */}
            {showLinkModal && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowLinkModal(false)}>
                    <div className="w-64 bg-slate-900 border border-sky-700 rounded p-3 space-y-2"
                        onClick={e => e.stopPropagation()}>
                        <div className="text-sky-400 font-mono text-[10px] mb-1">
                            {lang === 'zh' ? `第 ${linkIdx + 1} 张` : `Slide ${linkIdx + 1}`} — {lang === 'zh' ? '跳转链接' : 'Link'}
                        </div>
                        <input value={linkVal} onChange={e => setLinkVal(e.target.value)}
                            placeholder={lang === 'zh' ? '/projects, https://...' : '/projects, https://...'}
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
    const fileInputRef = useRef<HTMLInputElement>(null)

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
            if (!res.ok) throw new Error()
            const { urls }: { urls: string[] } = await res.json()
            const newMedia = [...(data?.media ?? []), ...urls]
            const newLinks = [...(data?.links ?? []), ...urls.map(() => '')]
            saveMedia(newMedia, newLinks)
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

    return (
        <div className="w-full h-full relative group">
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple
                className="hidden" onChange={e => handleFileUpload(e.target.files)} />

            {isLarge ? (
                <LargeCarousel
                    media={data?.media ?? []}
                    links={data?.links ?? []}
                    isEditing={isEditing}
                    onSave={(links) => saveMedia(data?.media ?? [], links)}
                    onUploadClick={() => isEditing && fileInputRef.current?.click()}
                />
            ) : (
                <SingleCarousel media={data?.media ?? []} links={data?.links ?? []} area={area} />
            )}

            {/* Delete button — non-TOP areas only */}
            {isEditing && !isLarge && data?.media?.length ? (
                <button onClick={() => removeMedia(data.media.length - 1)}
                    className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 border border-red-900 text-red-400 font-mono text-[9px] hover:border-red-700 z-20 opacity-0 group-hover:opacity-100 transition-all">
                    ✕ {lang === 'zh' ? '删除' : 'Remove'}
                </button>
            ) : null}
        </div>
    )
}

type PosterSlotProps = { area: Area }
