import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../../store/authStore'
import { useHasPermission } from '../../../hooks/usePermissions'
import { EditableText } from '../EditableText'
import { useEditorStore } from '../../../store/editorStore'
import {
    type BlockType, type ProjectBlock, type BlockContent,
    BLOCK_TYPES, DEFAULT_CONTENT,
} from '../../../types/block'

interface BlockEditorProps {
    projectId: string
    token: string
    blocks: ProjectBlock[]
    onBlocksChange: (blocks: ProjectBlock[]) => void
}

const ASPECT_RATIOS = ['1:1', '1:2', '2:1', '2:2'] as const

export function BlockEditor({ projectId, token, blocks, onBlocksChange }: BlockEditorProps) {
    const { i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const { role } = useAuthStore()
    const canManage = useHasPermission('manage_projects')
    const isEditing = !!(token && (role === 'COMPANY' || canManage))

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map())

    // Mouse-based block reorder (avoids HTML5 drag API conflicts with block internals)
    const [mouseDragId, setMouseDragId] = useState<string | null>(null)
    const mouseDragIdRef = useRef<string | null>(null)
    const mouseOverIdRef = useRef<string | null>(null)

    // Scroll to newly selected block
    useEffect(() => {
        if (!selectedId) return
        const el = blockRefs.current.get(selectedId)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
    }, [selectedId])

    // Mouse-based block reorder — no HTML5 drag API
    useEffect(() => {
        const onMouseMove = () => { /* no-op, just keep listener alive */ }
        const onMouseUp = () => {
            if (mouseDragIdRef.current && mouseOverIdRef.current && mouseDragIdRef.current !== mouseOverIdRef.current) {
                const from = blocks.findIndex(b => b.id === mouseDragIdRef.current)
                const to   = blocks.findIndex(b => b.id === mouseOverIdRef.current)
                if (from >= 0 && to >= 0) {
                    const reordered = [...blocks]
                    const [moved] = reordered.splice(from, 1)
                    reordered.splice(to, 0, moved)
                    onBlocksChange(reordered)
                    fetch(`/api/projects/${projectId}/blocks/reorder`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ order: reordered.map(b => b.id) }),
                    })
                }
            }
            mouseDragIdRef.current = null
            mouseOverIdRef.current = null
            setMouseDragId(null)
        }
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
    }, [blocks, projectId, token])

    // ── API helpers ──────────────────────────────────────────────
    const saveBlock = async (blockId: string, content: BlockContent) => {
        setSaving(true)
        try {
            const res = await fetch(`/api/projects/${projectId}/blocks/${blockId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content }),
            })
            if (res.ok) {
                const updated: ProjectBlock = await res.json()
                onBlocksChange(blocks.map(b => b.id === blockId ? updated : b))
            }
        } finally {
            setSaving(false)
        }
    }

    const addBlock = async (type: BlockType) => {
        setSaving(true)
        try {
            const res = await fetch(`/api/projects/${projectId}/blocks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ type, content: DEFAULT_CONTENT[type], order: blocks.length }),
            })
            if (res.ok) {
                const created: ProjectBlock = await res.json()
                // Insert after selected block (or at end)
                if (selectedId) {
                    const idx = blocks.findIndex(b => b.id === selectedId)
                    const newBlocks = [...blocks]
                    newBlocks.splice(idx + 1, 0, created)
                    onBlocksChange(newBlocks)
                    setSelectedId(created.id)
                } else {
                    onBlocksChange([...blocks, created])
                    setSelectedId(created.id)
                }
            }
        } finally {
            setSaving(false)
        }
    }

    const deleteBlock = async (blockId: string) => {
        if (!confirm(lang === 'zh' ? '确认删除此区块？' : 'Delete this block?')) return
        setSaving(true)
        try {
            const res = await fetch(`/api/projects/${projectId}/blocks/${blockId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                onBlocksChange(blocks.filter(b => b.id !== blockId))
                if (selectedId === blockId) setSelectedId(null)
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex gap-4">
            {/* ── Sidebar (only shown when editing) ── */}
            {isEditing && (
                <div className={`flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-48' : 'w-0'} overflow-hidden`}>
                    {sidebarOpen && (
                        <div className="w-48 bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-1">
                            <div className="text-slate-500 font-mono text-[10px] tracking-widest uppercase mb-2">
                                {lang === 'zh' ? '添加区块' : 'Add Block'}
                            </div>
                            {BLOCK_TYPES.map(bt => (
                                <button
                                    key={bt.type}
                                    onClick={() => addBlock(bt.type)}
                                    disabled={saving}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded border border-slate-800
                                               text-slate-400 font-mono text-xs hover:border-sky-800 hover:text-sky-400
                                               transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span className="text-base w-5 text-center">{bt.icon}</span>
                                    <span>{lang === 'zh' ? bt.labelZh : bt.labelEn}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Toggle sidebar button (only when editing) ── */}
            {isEditing && (
                <button
                    onClick={() => setSidebarOpen(v => !v)}
                    className="fixed left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-slate-900/90 border border-slate-700
                               text-slate-500 font-mono text-sm hover:text-sky-400 hover:border-sky-700 transition-all z-20 shadow-lg"
                    title={lang === 'zh' ? (sidebarOpen ? '收起侧边栏' : '展开侧边栏') : (sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar')}
                >
                    {sidebarOpen ? '‹' : '›'}
                </button>
            )}

            {/* ── Block list ── */}
            <div className="flex-1 min-w-0 space-y-3">
                {saving && (
                    <div className="text-center py-2">
                        <span className="text-sky-500 font-mono text-[10px] animate-pulse">
                            {lang === 'zh' ? '保存中...' : 'Saving...'}
                        </span>
                    </div>
                )}

                {blocks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="text-slate-700 text-3xl">◈</div>
                        <p className="text-slate-600 font-mono text-xs">
                            {lang === 'zh' ? '点击左侧添加第一个区块' : 'Add your first block from the left'}
                        </p>
                    </div>
                )}

                {blocks.map((block) => (
                    <div
                        key={block.id}
                        ref={el => { if (el) blockRefs.current.set(block.id, el) }}
                    >
                    <BlockItem
                        key={block.id}
                        block={block}
                        lang={lang}
                        isEditing={isEditing}
                        isSelected={selectedId === block.id}
                        isDragging={mouseDragId === block.id}
                        onSelect={() => setSelectedId(selectedId === block.id ? null : block.id)}
                        onDelete={() => deleteBlock(block.id)}
                        onSave={(content) => saveBlock(block.id, content)}
                        onDragStart={() => {
                            setMouseDragId(block.id)
                            mouseDragIdRef.current = block.id
                            mouseOverIdRef.current = block.id
                        }}
                        onDragEnter={() => { if (mouseDragId) mouseOverIdRef.current = block.id }}
                    />
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// Block Item
// ─────────────────────────────────────────────────────────────────
interface BlockItemProps {
    block: ProjectBlock
    lang: 'zh' | 'en'
    isEditing: boolean
    isSelected: boolean
    isDragging: boolean
    onSelect: () => void
    onDelete: () => void
    onSave: (content: BlockContent) => void
    onDragStart: () => void
    onDragEnter: () => void
}

function BlockItem({
    block, lang, isEditing, isSelected, isDragging,
    onSelect, onDelete, onSave, onDragStart, onDragEnter,
}: BlockItemProps) {
    return (
        <div
            onClick={isEditing && !isSelected ? onSelect : undefined}
            onMouseEnter={onDragEnter}
            className={`group transition-all
                       ${isDragging ? 'opacity-40' : ''}
                       ${isEditing && !isSelected ? 'cursor-pointer' : ''}`}
        >
            {/* Block header — handles mouse-based reorder, only shown in edit mode */}
            {isEditing && (
                <div
                    onMouseDown={e => {
                        e.stopPropagation()
                        onDragStart()
                    }}
                    className="flex items-center justify-between px-2 py-1 cursor-grab active:cursor-grabbing select-none opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <span className="flex items-center gap-1 text-slate-500/70 font-mono text-[9px] tracking-widest uppercase">
                        <span className="text-slate-500">⋮⋮</span>
                        <span>{block.type}</span>
                        <span className="text-sky-600">↕</span>
                    </span>
                    <button
                        onClick={e => { e.stopPropagation(); onDelete() }}
                        className="text-red-500/50 hover:text-red-400 font-mono text-xs px-1 transition-colors"
                    >✕</button>
                </div>
            )}

            {/* Selected indicator bar */}
            {isEditing && isSelected && (
                <div className="h-0.5 bg-sky-500/40 -mx-4 mb-2" />
            )}

            <div
                onClick={isEditing && isSelected ? (e) => e.stopPropagation() : undefined}
            >
                <BlockContent
                    block={block}
                    lang={lang}
                    isEditing={isEditing && isSelected}
                    onSave={onSave}
                />
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// Block Content — render/edit based on type
// ─────────────────────────────────────────────────────────────────
interface BlockContentProps {
    block: ProjectBlock
    lang: 'zh' | 'en'
    isEditing: boolean
    onSave: (content: BlockContent) => void
}

function BlockContent({ block, lang, isEditing, onSave }: BlockContentProps) {
    const c = block.content as Record<string, unknown>

    switch (block.type) {
        case 'title': {
            const content = block.content as import('../../../types/block').TitleContent
            return (
                <div className="space-y-2">
                    {/* Level selector */}
                    {isEditing && (
                        <div className="flex gap-2 mb-2">
                            {[1, 2].map(lvl => (
                                <button key={lvl}
                                    onClick={() => onSave({ ...content, level: lvl as 1 | 2 })}
                                    className={`px-2 py-0.5 rounded border font-mono text-xs transition-all
                                        ${content.level === lvl
                                            ? 'border-sky-600 text-sky-300'
                                            : 'border-slate-700 text-slate-500'}`}>
                                    H{lvl}
                                </button>
                            ))}
                        </div>
                    )}
                    {isEditing ? (
                        <RichTextBlock
                            content={{ content: content.text[lang], align: 'left', textIndent: 0, fontSize: content.level === 1 ? 36 : 24, fontFamily: 'inherit' }}
                            isEditing={isEditing}
                            lang={lang}
                            onSave={val => onSave({ ...content, text: { ...content.text, [lang]: val.content } })}
                        />
                    ) : (
                        <div
                            className={`${content.level === 1 ? 'text-2xl font-bold' : 'text-xl font-semibold'} text-slate-100`}
                            dangerouslySetInnerHTML={{ __html: content.text[lang] }}
                        />
                    )}
                </div>
            )
        }

        case 'subtitle': {
            const content = block.content as import('../../../types/block').SubtitleContent
            return isEditing ? (
                <RichTextBlock
                    content={{ content: content.text[lang], align: 'left', textIndent: 0, fontSize: 20, fontFamily: 'inherit' }}
                    isEditing={isEditing}
                    lang={lang}
                    onSave={val => onSave({ ...content, text: { ...content.text, [lang]: val.content } })}
                />
            ) : (
                <div
                    className="text-lg text-slate-300 font-medium"
                    dangerouslySetInnerHTML={{ __html: content.text[lang] }}
                />
            )
        }

        case 'description': {
            const content = block.content as import('../../../types/block').DescriptionContent
            return isEditing ? (
                <RichTextBlock
                    content={{ content: content.text[lang], align: 'left', textIndent: 0, fontSize: 16, fontFamily: 'inherit' }}
                    isEditing={isEditing}
                    lang={lang}
                    onSave={val => onSave({ ...content, text: { ...content.text, [lang]: val.content } })}
                />
            ) : (
                <p
                    className="text-slate-400 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: content.text[lang] }}
                />
            )
        }

        case 'carousel': {
            const content = block.content as import('../../../types/block').CarouselContent
            return (
                <CarouselBlock
                    content={content}
                    isEditing={isEditing}
                    onSave={onSave}
                    lang={lang}
                />
            )
        }

        case 'text': {
            const content = block.content as import('../../../types/block').TextContent
            return isEditing ? (
                <RichTextBlock content={content} isEditing={isEditing} lang={lang} onSave={onSave} />
            ) : (
                <div
                    className="text-slate-300 text-sm leading-relaxed"
                    style={{
                        textAlign: content.align,
                        textIndent: content.textIndent ? `${content.textIndent}em` : undefined,
                        fontSize: content.fontSize ? `${content.fontSize}px` : undefined,
                        fontFamily: content.fontFamily !== 'inherit' ? content.fontFamily : undefined,
                    }}
                    dangerouslySetInnerHTML={{ __html: content.content }}
                />
            )
        }

        case 'divider':
            return <hr className="border-slate-800" />

        case 'progress': {
            const content = block.content as import('../../../types/block').ProgressContent
            const trackRef = useRef<HTMLDivElement>(null)
            const [draftValue, setDraftValue] = useState(content.value)
            const isDraggingBar = useRef(false)

            const applyPosition = useCallback((clientX: number) => {
                const track = trackRef.current
                if (!track) return
                const rect = track.getBoundingClientRect()
                const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
                setDraftValue(Math.round(ratio * 100))
            }, [])

            useEffect(() => {
                const onMove = (e: MouseEvent) => { if (isDraggingBar.current) applyPosition(e.clientX) }
                const onUp = () => {
                    if (isDraggingBar.current) {
                        isDraggingBar.current = false
                        onSave({ ...content, value: draftValue })
                    }
                }
                window.addEventListener('mousemove', onMove)
                window.addEventListener('mouseup', onUp)
                return () => {
                    window.removeEventListener('mousemove', onMove)
                    window.removeEventListener('mouseup', onUp)
                }
            }, [draftValue, applyPosition])

            // Sync draftValue when content.value changes (e.g., after save)
            useEffect(() => { setDraftValue(content.value) }, [content.value])

            return (
                <div className="space-y-2">
                    {isEditing && (
                        <div
                            className="flex items-center gap-3 mb-2 select-none"
                            onMouseDown={e => {
                                e.stopPropagation()
                                isDraggingBar.current = true
                                applyPosition(e.clientX)
                            }}
                        >
                            <div ref={trackRef} className="flex-1 h-2 bg-slate-800 rounded-full cursor-pointer">
                                <div
                                    className="h-full bg-sky-500 rounded-full"
                                    style={{ width: `${draftValue}%` }}
                                />
                            </div>
                            <span className="text-sky-400 font-mono text-xs w-8">{draftValue}%</span>
                        </div>
                    )}
                    {isEditing ? (
                        <EditableText
                            value={content.label[lang]}
                            tag="span"
                            className="text-slate-500 font-mono text-xs"
                            onSave={val => onSave({ ...content, label: { ...content.label, [lang]: val } })}
                        />
                    ) : (
                        <span className="text-slate-500 font-mono text-xs">{content.label[lang]}</span>
                    )}
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-sky-500 rounded-full transition-all duration-500"
                            style={{ width: `${content.value}%` }}
                        />
                    </div>
                </div>
            )
        }

        case 'link': {
            const content = block.content as import('../../../types/block').LinkContent
            const resolvedHref = content.url.match(/^https?:\/\//)
                ? content.url
                : `https://${content.url}`
            return (
                <div className="space-y-2">
                    {isEditing && (
                        <input
                            value={content.url}
                            onChange={e => onSave({ ...content, url: e.target.value })}
                            placeholder="https://..."
                            className="w-full bg-slate-900/60 border border-slate-700 rounded px-3 py-1.5
                                       text-slate-300 font-mono text-xs placeholder:text-slate-600
                                       focus:outline-none focus:border-sky-700"
                        />
                    )}
                    {isEditing ? (
                        <EditableText
                            value={content.text[lang]}
                            tag="span"
                            className="text-sky-400 hover:text-sky-300 underline"
                            onSave={val => onSave({ ...content, text: { ...content.text, [lang]: val } })}
                        />
                    ) : (
                        <a
                            href={resolvedHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:text-sky-300 underline"
                        >
                            {content.text[lang]}
                        </a>
                    )}
                </div>
            )
        }

        case 'tags': {
            const content = block.content as import('../../../types/block').TagsContent
            return (
                <div className="space-y-2">
                    {isEditing && (
                        <TagInput
                            tags={content.tags}
                            lang={lang}
                            onSave={tags => onSave({ ...content, tags })}
                        />
                    )}
                    <div className="flex flex-wrap gap-2">
                        {content.tags.map((tag, i) => (
                            <span key={i}
                                className="px-2.5 py-0.5 rounded-full border border-slate-700
                                           text-slate-400 font-mono text-xs">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            )
        }

        default:
            return <div className="text-slate-600 font-mono text-xs">Unknown block type: {block.type}</div>
    }
}

// ─────────────────────────────────────────────────────────────────
// Carousel Block
// ─────────────────────────────────────────────────────────────────
interface CarouselBlockProps {
    content: import('../../../types/block').CarouselContent
    isEditing: boolean
    lang: 'zh' | 'en'
    onSave: (content: import('../../../types/block').CarouselContent) => void
}

function CarouselBlock({ content, isEditing, lang, onSave }: CarouselBlockProps) {
    const { token } = useEditorStore()
    const [current, setCurrent] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const aspectClass = {
        '1:1': 'aspect-square',
        '1:2': 'aspect-[1/2]',
        '2:1': 'aspect-[2/1]',
        '2:2': 'aspect-square',
    }[content.aspectRatio] || 'aspect-[2/1]'

    // Auto-rotate
    useEffect(() => {
        if (content.media.length <= 1) {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
            return
        }
        timerRef.current = setInterval(() => {
            setCurrent(c => (c + 1) % content.media.length)
        }, 5000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [content.media])

    const handleUpload = async (files: FileList | null) => {
        if (!files?.length) return
        setIsUploading(true)
        try {
            const newUrls: string[] = []
            for (const file of Array.from(files)) {
                const formData = new FormData()
                formData.append('files', file)
                const res = await fetch('/api/posters/upload', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                })
                if (res.ok) {
                    const { urls } = await res.json()
                    newUrls.push(...urls)
                }
            }
            onSave({ ...content, media: [...content.media, ...newUrls] })
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-2">
            {/* Aspect ratio selector */}
            {isEditing && (
                <div className="flex gap-1 mb-2">
                    {ASPECT_RATIOS.map(ratio => (
                        <button key={ratio}
                            onClick={() => onSave({ ...content, aspectRatio: ratio as import('../../../types/block').CarouselContent['aspectRatio'] })}
                            className={`px-2 py-0.5 rounded border font-mono text-xs transition-all
                                ${content.aspectRatio === ratio
                                    ? 'border-sky-600 text-sky-300'
                                    : 'border-slate-700 text-slate-500'}`}>
                            {ratio}
                        </button>
                    ))}
                </div>
            )}

            {/* Media area */}
            <div className={`w-full ${aspectClass} bg-slate-900 rounded-lg overflow-hidden relative`}>
                {content.media.length > 0 ? (
                    <div className="w-full h-full">
                        {content.media.map((url, i) => (
                            <div
                                key={url}
                                className="absolute inset-0 transition-opacity duration-500"
                                style={{ opacity: i === current ? 1 : 0 }}
                            >
                                {url.match(/\.(mp4|webm|mov)$/i)
                                    ? <video src={url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                                    : <img src={url} alt="" className="w-full h-full object-cover" draggable={false} />
                                }
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <div className="text-slate-700 text-2xl">◈</div>
                        <span className="text-slate-700 font-mono text-[10px]">
                            {lang === 'zh' ? '点击添加图片或视频' : 'Click to add images or video'}
                        </span>
                    </div>
                )}

                {/* Prev/next */}
                {content.media.length > 1 && (
                    <>
                        <button
                            onClick={() => setCurrent(c => (c - 1 + content.media.length) % content.media.length)}
                            className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full
                                       bg-black/50 border border-white/20 text-white/60 font-mono text-xs
                                       hover:bg-black/70 hover:text-white transition-all z-10"
                        >‹</button>
                        <button
                            onClick={() => setCurrent(c => (c + 1) % content.media.length)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full
                                       bg-black/50 border border-white/20 text-white/60 font-mono text-xs
                                       hover:bg-black/70 hover:text-white transition-all z-10"
                        >›</button>
                    </>
                )}

                {/* Indicators */}
                {content.media.length > 1 && (
                    <div className="absolute bottom-1.5 right-1.5 flex gap-1 z-10">
                        {content.media.map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white' : 'bg-white/30'}`} />
                        ))}
                    </div>
                )}

                {/* Upload overlay */}
                {isEditing && (
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={e => handleUpload(e.target.files)}
                    />
                )}
                <button
                    onClick={() => isEditing && inputRef.current?.click()}
                    disabled={isUploading}
                    className={`absolute inset-0 flex items-center justify-center gap-2
                               ${isEditing ? 'cursor-pointer hover:bg-black/20' : ''}
                               ${content.media.length > 0 ? 'opacity-0 hover:opacity-100' : ''}
                               transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isUploading
                        ? <span className="text-white font-mono text-xs animate-pulse">...</span>
                        : isEditing && <span className="text-white font-mono text-xs bg-black/60 px-2 py-1 rounded border border-white/20">
                            + {lang === 'zh' ? '添加' : 'Add'}
                        </span>
                    }
                </button>
            </div>

            {/* Remove current */}
            {isEditing && content.media.length > 0 && (
                <button
                    onClick={() => {
                        const newMedia = content.media.filter((_, i) => i !== current)
                        onSave({ ...content, media: newMedia })
                        setCurrent(Math.max(0, current - 1))
                    }}
                    className="text-red-400/50 hover:text-red-300 font-mono text-[10px] transition-colors"
                >
                    ✕ {lang === 'zh' ? '删除当前' : 'Remove current'}
                </button>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// Rich Text Block — contentEditable with inline formatting toolbar
// ─────────────────────────────────────────────────────────────────
function RichTextBlock({ content, isEditing, lang, onSave }: {
    content: import('../../../types/block').TextContent
    isEditing: boolean
    lang: 'zh' | 'en'
    onSave: (c: import('../../../types/block').TextContent) => void
}) {
    const { t } = useTranslation()
    const editorRef = useRef<HTMLDivElement>(null)
    const isTypingRef = useRef<'idle' | 'typing' | 'ime'>('idle')

    // Local state for all formatting options — drives both DOM style and button active states
    const [align, setAlign] = useState(content.align)
    const [textIndent, setTextIndent] = useState(content.textIndent)
    const [fontSize, setFontSize] = useState(content.fontSize)
    const [fontFamily, setFontFamily] = useState(content.fontFamily)
    // Force re-render to update button active states when execCmd changes selection
    const [, rerender] = useState(0)
    const triggerRerender = () => rerender(n => n + 1)

    // Sync local state when content prop changes (e.g., after save from parent)
    useEffect(() => { setAlign(content.align) }, [content.align])
    useEffect(() => { setTextIndent(content.textIndent) }, [content.textIndent])
    useEffect(() => { setFontSize(content.fontSize) }, [content.fontSize])
    useEffect(() => { setFontFamily(content.fontFamily) }, [content.fontFamily])

    // Initialize contentEditable when editing starts
    useEffect(() => {
        const el = editorRef.current
        if (!el) return
        if (isEditing) {
            el.innerHTML = content.content
        }
    }, [isEditing])

    // Apply text style to the editor DOM element directly (avoids React re-render when typing)
    const applyTextStyle = useCallback(() => {
        const el = editorRef.current
        if (!el) return
        el.style.textAlign = align
        el.style.textIndent = textIndent ? `${textIndent}em` : ''
        el.style.fontSize = fontSize ? `${fontSize}px` : ''
        el.style.fontFamily = fontFamily !== 'inherit' ? fontFamily : ''
    }, [align, textIndent, fontSize, fontFamily])

    const textStyle = {
        textAlign: align,
        textIndent: textIndent ? `${textIndent}em` : undefined,
        fontSize: fontSize ? `${fontSize}px` : undefined,
        fontFamily: fontFamily !== 'inherit' ? fontFamily : undefined,
    }

    // Save with current local formatting state — called on blur, align, indent, font change
    const saveWithFormat = useCallback((newContent?: string) => {
        const html = newContent ?? editorRef.current?.innerHTML ?? ''
        onSave({ ...content, content: html, align, textIndent, fontSize, fontFamily })
    }, [content, align, textIndent, fontSize, fontFamily, onSave])

    const execCmd = (cmd: string, value?: string) => {
        document.execCommand(cmd, false, value)
        editorRef.current?.focus()
    }

    const queryCmd = (cmd: string) => {
        try { return document.queryCommandState(cmd) }
        catch { return false }
    }

    const handleMouseUp = () => { triggerRerender() }

    const handleInput = () => { isTypingRef.current = 'typing' }

    const handleBlur = () => {
        if (isTypingRef.current === 'ime') return
        const editor = editorRef.current
        if (!editor) return
        isTypingRef.current = 'idle'
        saveWithFormat()
    }

    const handleCompositionStart = () => { isTypingRef.current = 'ime' }
    const handleCompositionEnd = () => {
        isTypingRef.current = 'idle'
        // Force rerender after IME composition to update B/I/U button states
        triggerRerender()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            execCmd('insertParagraph')
            triggerRerender()
        }
        if (e.key === 'Tab') {
            e.preventDefault()
            execCmd('insertText', '    ')
        }
    }

    const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32]
    const fontFamilies = [
        { label: lang === 'zh' ? '默认' : 'Default', value: 'inherit' },
        { label: lang === 'zh' ? '宋体' : 'SimSun', value: '"SimSun", serif' },
        { label: lang === 'zh' ? '黑体' : 'SimHei', value: '"SimHei", sans-serif' },
        { label: lang === 'zh' ? '微软雅黑' : 'YaHei', value: '"Microsoft YaHei", sans-serif' },
        { label: 'Arial', value: 'Arial, sans-serif' },
        { label: 'Georgia', value: 'Georgia, serif' },
        { label: 'Courier', value: '"Courier New", monospace' },
    ]

    return (
        <div className="space-y-2">
            {isEditing && (
                <>
                    <div className="flex flex-wrap gap-1 mb-2 p-2 bg-slate-900/80 border border-slate-800 rounded-lg">
                        <button
                            onMouseDown={e => { e.preventDefault(); execCmd('bold'); triggerRerender() }}
                            title={t('editor.textEditor.bold')}
                            className={`w-7 h-7 rounded border font-mono text-sm font-bold transition-all
                                ${queryCmd('bold') ? 'border-sky-600 text-sky-300 bg-sky-900/40' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
                        >B</button>
                        <button
                            onMouseDown={e => { e.preventDefault(); execCmd('italic'); triggerRerender() }}
                            title={t('editor.textEditor.italic')}
                            className={`w-7 h-7 rounded border font-mono text-sm italic transition-all
                                ${queryCmd('italic') ? 'border-sky-600 text-sky-300 bg-sky-900/40' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
                        >I</button>
                        <button
                            onMouseDown={e => { e.preventDefault(); execCmd('underline'); triggerRerender() }}
                            title={t('editor.textEditor.underline')}
                            className={`w-7 h-7 rounded border font-mono text-sm underline-offset-4 transition-all
                                ${queryCmd('underline') ? 'border-sky-600 text-sky-300 bg-sky-900/40' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
                            style={{ textDecorationLine: 'underline' }}
                        >U</button>
                        <button
                            onMouseDown={e => { e.preventDefault(); execCmd('strikeThrough'); triggerRerender() }}
                            title={t('editor.textEditor.strikethrough')}
                            className={`w-7 h-7 rounded border font-mono text-xs transition-all
                                ${queryCmd('strikeThrough') ? 'border-sky-600 text-sky-300 bg-sky-900/40' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
                        >S̶</button>

                        <div className="w-px h-6 bg-slate-700 self-center mx-1" />

                        <button
                            onMouseDown={e => {
                                e.preventDefault()
                                execCmd('justifyLeft')
                                setAlign('left')
                                applyTextStyle()
                                triggerRerender()
                                saveWithFormat()
                            }}
                            title={t('editor.textEditor.alignLeft')}
                            className={`w-7 h-7 rounded border font-mono text-sm transition-all
                                ${align === 'left' ? 'border-sky-600 text-sky-300 bg-sky-900/40' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
                        >⫷</button>
                        <button
                            onMouseDown={e => {
                                e.preventDefault()
                                execCmd('justifyCenter')
                                setAlign('center')
                                applyTextStyle()
                                triggerRerender()
                                saveWithFormat()
                            }}
                            title={t('editor.textEditor.alignCenter')}
                            className={`w-7 h-7 rounded border font-mono text-sm transition-all
                                ${align === 'center' ? 'border-sky-600 text-sky-300 bg-sky-900/40' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
                        >≡</button>
                        <button
                            onMouseDown={e => {
                                e.preventDefault()
                                execCmd('justifyRight')
                                setAlign('right')
                                applyTextStyle()
                                triggerRerender()
                                saveWithFormat()
                            }}
                            title={t('editor.textEditor.alignRight')}
                            className={`w-7 h-7 rounded border font-mono text-sm transition-all
                                ${align === 'right' ? 'border-sky-600 text-sky-300 bg-sky-900/40' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
                        >⫸</button>

                        <div className="w-px h-6 bg-slate-700 self-center mx-1" />

                        <button
                            onMouseDown={e => {
                                e.preventDefault()
                                execCmd('indent')
                                const next = textIndent + 1
                                setTextIndent(next)
                                applyTextStyle()
                                saveWithFormat()
                            }}
                            title={t('editor.textEditor.indentMore')}
                            className="w-7 h-7 rounded border border-slate-700 text-slate-500 font-mono text-sm hover:border-slate-600 transition-all"
                        >⇥</button>
                        <button
                            onMouseDown={e => {
                                e.preventDefault()
                                execCmd('outdent')
                                const next = Math.max(0, textIndent - 1)
                                setTextIndent(next)
                                applyTextStyle()
                                saveWithFormat()
                            }}
                            title={t('editor.textEditor.indentLess')}
                            className="w-7 h-7 rounded border border-slate-700 text-slate-500 font-mono text-sm hover:border-slate-600 transition-all"
                        >⇤</button>

                        <div className="w-px h-6 bg-slate-700 self-center mx-1" />

                        <select
                            title={t('editor.textEditor.fontSize')}
                            value={fontSize}
                            onChange={e => {
                                const val = Number(e.target.value)
                                setFontSize(val)
                                applyTextStyle()
                                saveWithFormat()
                            }}
                            className="h-7 px-1 rounded border border-slate-700 text-slate-400 font-mono text-xs bg-slate-900/80 focus:outline-none focus:border-sky-700"
                        >
                            {fontSizes.map(s => (
                                <option key={s} value={s}>{s}px</option>
                            ))}
                        </select>

                        <select
                            title={t('editor.textEditor.fontFamily')}
                            value={fontFamily}
                            onChange={e => {
                                setFontFamily(e.target.value)
                                applyTextStyle()
                                saveWithFormat()
                            }}
                            className="h-7 px-1 rounded border border-slate-700 text-slate-400 font-mono text-xs bg-slate-900/80 focus:outline-none focus:border-sky-700"
                        >
                            {fontFamilies.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            <div
                ref={editorRef}
                contentEditable={isEditing}
                suppressContentEditableWarning
                onInput={handleInput}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onMouseUp={handleMouseUp}
                onKeyUp={handleMouseUp}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                style={textStyle}
                className={`w-full min-h-[60px] px-3 py-2 bg-slate-900/60 border border-slate-800 rounded
                           text-slate-300 text-sm leading-relaxed font-mono
                           focus:outline-none focus:border-sky-700
                           ${!isEditing ? 'bg-transparent border-transparent cursor-default' : 'cursor-text'}`}
            />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// Tag input — local state preserves spaces; Enter or space commits tag
// ─────────────────────────────────────────────────────────────────
function TagInput({ tags, lang, onSave }: { tags: string[]; lang: 'zh' | 'en'; onSave: (tags: string[]) => void }) {
    const [draft, setDraft] = useState('')

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            const trimmed = draft.trim()
            if (trimmed) {
                onSave([...tags.filter(t => t !== trimmed), trimmed])
                setDraft('')
            }
        } else if (e.key === 'Backspace' && !draft && tags.length > 0) {
            onSave(tags.slice(0, -1))
        }
    }

    return (
        <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
                <span
                    key={i}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-sky-800 bg-sky-950/40
                               text-sky-300 font-mono text-xs"
                >
                    #{tag}
                    <button
                        onClick={() => onSave(tags.filter((_, j) => j !== i))}
                        className="text-sky-600 hover:text-sky-400 text-xs leading-none transition-colors"
                    >×</button>
                </span>
            ))}
            <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={lang === 'zh' ? '输入标签回车添加' : 'Type and press Enter'}
                className="flex-1 min-w-[120px] bg-transparent border border-slate-700 rounded px-2 py-0.5
                           text-slate-300 font-mono text-xs placeholder:text-slate-600
                           focus:outline-none focus:border-sky-700"
            />
        </div>
    )
}
