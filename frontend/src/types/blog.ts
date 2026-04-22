export interface BlogPost {
    id:         string
    title:      { zh: string; en: string }
    excerpt:    { zh: string; en: string }
    coverImage: string | null
    tags:       string[]
    authorId:   string | null
    author?:    { id: string; email: string }
    isPublished: boolean
    createdAt:  string
    updatedAt?: string
}

export interface PaginatedPosts {
    posts:      BlogPost[]
    total:      number
    page:       number
    limit:      number
    totalPages: number
}
