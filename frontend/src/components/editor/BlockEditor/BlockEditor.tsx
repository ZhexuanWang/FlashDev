import { useState, useRef } from 'react'
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
const TEXT_STYLES = ['default', 'bold', 'italic'] as const

export function BlockEditor({ projectId, token, blocks, onBlocksChange }: BlockEditorProps) {
    const { i18n } = useTranslation()
    const lang = i18n.language === 'zh' ? 'zh' : 'en'
    const { role } = useAuthStore()
    const canManage = useHasPermission('manage_projects')
    const isEditing = !!(token && (role === 'COMPANY' || canManage))

    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [draggedId, setDraggedId] = useState<string | null>(null)

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
                onBlocksChange([...blocks, created])
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

    // ── Drag & drop ──────────────────────────────────────────────
    const handleDragStart = (id: string) => { setDraggedId(id) }
    const handleDrop = (targetId: string) => {
        if (!draggedId || draggedId === targetId) { setDraggedId(null); return }
        const from = blocks.findIndex(b => b.id === draggedId)
        const to   = blocks.findIndex(b => b.id === targetId)
        if (from < 0 || to < 0) { setDraggedId(null); return }
        const reordered = [...blocks]
        const [moved] = reordered.splice(from, 1)
        reordered.splice(to, 0, moved)
        onBlocksChange(reordered)
        // Sync to server
        fetch(`/api/projects/${projectId}/blocks/reorder`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ order: reordered.map(b => b.id) }),
        })
        setDraggedId(null)
    }

    return (
        <div className="flex gap-4">
            {/* ── Sidebar ── */}
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

            {/* ── Toggle sidebar button ── */}
            <button
                onClick={() => setSidebarOpen(v => !v)}
                className="absolute left-6 top-24 w-6 h-6 rounded bg-slate-900/80 border border-slate-700
                           text-slate-500 font-mono text-sm hover:text-sky-400 hover:border-sky-700 transition-all z-10"
                title={lang === 'zh' ? (sidebarOpen ? '收起侧边栏' : '展开侧边栏') : (sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar')}
            >
                {sidebarOpen ? '‹' : '›'}
            </button>

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
                    <BlockItem
                        key={block.id}
                        block={block}
                        lang={lang}
                        isEditing={isEditing}
                        isSelected={selectedId === block.id}
                        isDragging={draggedId === block.id}
                        onSelect={() => setSelectedId(selectedId === block.id ? null : block.id)}
                        onDelete={() => deleteBlock(block.id)}
                        onSave={(content) => saveBlock(block.id, content)}
                        onDragStart={() => handleDragStart(block.id)}
                        onDrop={() => handleDrop(block.id)}
                        projectId={projectId}
                        token={token}
                    />
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
    onDrop: () => void
    projectId: string
    token: string
}

function BlockItem({
    block, lang, isEditing, isSelected, isDragging,
    onSelect, onDelete, onSave, onDragStart, onDrop,
}: BlockItemProps) {
    const borderColor = isSelected ? 'border-sky-600' : isDragging ? 'border-sky-400' : 'border-slate-800'
    const bgColor = isSelected ? 'bg-sky-950/20' : 'bg-slate-900/60'

    return (
        <div
            draggable={isEditing}
            onDragStart={isEditing ? onDragStart : undefined}
            onDragOver={e => e.preventDefault()}
            onDrop={isEditing ? onDrop : undefined}
            onClick={isEditing ? onSelect : undefined}
            className={`rounded-lg border ${borderColor} ${bgColor} transition-all
                       ${isDragging ? 'opacity-50' : ''}
                       ${isEditing ? 'cursor-pointer hover:border-sky-700' : ''}`}
        >
            {/* Block header */}
            {isEditing && (
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-600 font-mono text-[10px] tracking-widest uppercase">
                        {block.type}
                    </span>
                    <div className="flex items-center gap-1">
                        <span className="text-slate-700 font-mono text-xs select-none cursor-grab">⋮⋮</span>
                        <button
                            onClick={e => { e.stopPropagation(); onDelete() }}
                            className="text-red-500/50 hover:text-red-400 font-mono text-xs px-1 transition-colors"
                        >✕</button>
                    </div>
                </div>
            )}

            {/* Block content */}
            <div className="p-4">
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
                        <EditableText
                            value={content.text[lang]}
                            tag={`h${content.level}`}
                            className={`${content.level === 1 ? 'text-2xl font-bold' : 'text-xl font-semibold'} text-slate-100`}
                            onSave={val => onSave({ ...content, text: { ...content.text, [lang]: val } })}
                        />
                    ) : (
                        <div className={`${content.level === 1 ? 'text-2xl font-bold' : 'text-xl font-semibold'} text-slate-100`}>
                            {content.text[lang]}
                        </div>
                    )}
                </div>
            )
        }

        case 'subtitle': {
            const content = block.content as import('../../../types/block').SubtitleContent
            return isEditing ? (
                <EditableText
                    value={content.text[lang]}
                    tag="h3"
                    className="text-lg text-slate-300 font-medium"
                    onSave={val => onSave({ ...content, text: { ...content.text, [lang]: val } })}
                />
            ) : (
                <div className="text-lg text-slate-300 font-medium">{content.text[lang]}</div>
            )
        }

        case 'description': {
            const content = block.content as import('../../../types/block').DescriptionContent
            return isEditing ? (
                <EditableText
                    value={content.text[lang]}
                    tag="p"
                    className="text-slate-400 leading-relaxed"
                    onSave={val => onSave({ ...content, text: { ...content.text, [lang]: val } })}
                />
            ) : (
                <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">{content.text[lang]}</p>
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
            return (
                <div className="space-y-2">
                    {isEditing && (
                        <div className="flex gap-1 mb-2">
                            {TEXT_STYLES.map(s => (
                                <button key={s}
                                    onClick={() => {
                                        const styles = content.styles.includes(s)
                                            ? content.styles.filter(x => x !== s)
                                            : [...content.styles, s]
                                        onSave({ ...content, styles })
                                    }}
                                    className={`px-2 py-0.5 rounded border font-mono text-xs transition-all
                                        ${content.styles.includes(s)
                                            ? 'border-sky-600 text-sky-300'
                                            : 'border-slate-700 text-slate-500'}`}>
                                    {s === 'default' ? '默认' : s === 'bold' ? 'B' : 'I'}
                                </button>
                            ))}
                        </div>
                    )}
                    {isEditing ? (
                        <EditableText
                            value={content.content[lang]}
                            tag="p"
                            className={`text-slate-300 leading-relaxed ${content.styles.includes('bold') ? 'font-bold' : ''} ${content.styles.includes('italic') ? 'italic' : ''}`}
                            onSave={val => onSave({ ...content, content: { ...content.content, [lang]: val } })}
                        />
                    ) : (
                        <p className={`text-slate-300 leading-relaxed ${content.styles.includes('bold') ? 'font-bold' : ''} ${content.styles.includes('italic') ? 'italic' : ''}`}>
                            {content.content[lang]}
                        </p>
                    )}
                </div>
            )
        }

        case 'divider':
            return <hr className="border-slate-800" />

        case 'progress': {
            const content = block.content as import('../../../types/block').ProgressContent
            return (
                <div className="space-y-2">
                    {isEditing && (
                        <div className="flex items-center gap-3 mb-2">
                            <input
                                type="range"
                                min={0} max={100}
                                value={content.value}
                                onChange={e => onSave({ ...content, value: Number(e.target.value) })}
                                className="flex-1 accent-sky-500"
                            />
                            <span className="text-sky-400 font-mono text-xs w-8">{content.value}%</span>
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
                            href={content.url}
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
                        <input
                            value={content.tags.join(', ')}
                            onChange={e => onSave({
                                ...content,
                                tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
                            })}
                            placeholder="tag1, tag2, tag3"
                            className="w-full bg-slate-900/60 border border-slate-700 rounded px-3 py-1.5
                                       text-slate-300 font-mono text-xs placeholder:text-slate-600
                                       focus:outline-none focus:border-sky-700"
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

    const aspectClass = {
        '1:1': 'aspect-square',
        '1:2': 'aspect-[1/2]',
        '2:1': 'aspect-[2/1]',
        '2:2': 'aspect-square',
    }[content.aspectRatio] || 'aspect-[2/1]'

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
