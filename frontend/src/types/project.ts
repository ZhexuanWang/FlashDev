export type ProjectType = 'SHOWCASE' | 'FOR_SALE' | 'CUSTOM'

export interface ProjectCategory {
    id:   string
    name: { zh: string; en: string }
    icon: string
}

export interface Project {
    id:          string
    title:       { zh: string; en: string }
    description: { zh: string; en: string }
    type:        ProjectType
    category:    ProjectCategory | null
    media:       string[]
    price:       number | null
    isPublished: boolean
    createdAt:   string
}