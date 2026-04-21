export type BlockType =
    | 'title'
    | 'subtitle'
    | 'description'
    | 'carousel'
    | 'text'
    | 'divider'
    | 'progress'
    | 'link'
    | 'tags'

export interface TitleContent { text: { zh: string; en: string }; level: 1 | 2 }
export interface SubtitleContent { text: { zh: string; en: string } }
export interface DescriptionContent { text: { zh: string; en: string } }
export interface CarouselContent {
    media: string[]
    aspectRatio: '1:1' | '1:2' | '2:1' | '2:2'
}
export interface TextContent { content: { zh: string; en: string }; styles: string[] }
export interface DividerContent {}
export interface ProgressContent { value: number; label: { zh: string; en: string } }
export interface LinkContent { url: string; text: { zh: string; en: string } }
export interface TagsContent { tags: string[] }

export type BlockContent =
    | TitleContent
    | SubtitleContent
    | DescriptionContent
    | CarouselContent
    | TextContent
    | DividerContent
    | ProgressContent
    | LinkContent
    | TagsContent

export interface ProjectBlock {
    id: string
    projectId: string
    type: BlockType
    content: BlockContent
    order: number
}

export const BLOCK_TYPES: { type: BlockType; labelZh: string; labelEn: string; icon: string }[] = [
    { type: 'title',       labelZh: '大标题',      labelEn: 'Title',       icon: 'T'  },
    { type: 'subtitle',    labelZh: '副标题',      labelEn: 'Subtitle',    icon: 'S'  },
    { type: 'description', labelZh: '描述段落',    labelEn: 'Description', icon: 'P'  },
    { type: 'carousel',    labelZh: '轮播图片/视频', labelEn: 'Carousel',  icon: '◈' },
    { type: 'text',        labelZh: '文本框',      labelEn: 'Text',        icon: '¶'  },
    { type: 'divider',     labelZh: '分割线',      labelEn: 'Divider',     icon: '—'  },
    { type: 'progress',    labelZh: '进度条',      labelEn: 'Progress',    icon: '▓'  },
    { type: 'link',        labelZh: '链接',        labelEn: 'Link',        icon: '↗'  },
    { type: 'tags',        labelZh: '标签',        labelEn: 'Tags',        icon: '#'  },
]

export const DEFAULT_CONTENT: Record<BlockType, BlockContent> = {
    title:       { text: { zh: '标题', en: 'Title' },       level: 1 },
    subtitle:    { text: { zh: '副标题', en: 'Subtitle' }, level: 1 },
    description: { text: { zh: '', en: '' } },
    carousel:    { media: [], aspectRatio: '2:1' },
    text:        { content: { zh: '', en: '' }, styles: ['default'] },
    divider:     {},
    progress:    { value: 50, label: { zh: '进度', en: 'Progress' } },
    link:        { url: '', text: { zh: '点击访问', en: 'Click to visit' } },
    tags:        { tags: [] },
}
