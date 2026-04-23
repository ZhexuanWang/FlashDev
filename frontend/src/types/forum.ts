export interface ForumPost {
    id:        string
    title:     string
    content:   unknown   // JSON content
    authorId:  string | null
    author?:   { id: string; email: string }
    tags:      string[]
    upvotes:   number
    columnId:  string | null
    column?:   { id: string; name: Record<string, string> }
    groupId:   string | null
    group?:    { id: string; name: Record<string, string> }
    createdAt: string
    updatedAt: string
    _count?:   { comments: number }
}

export interface ForumComment {
    id:        string
    postId:    string
    authorId:  string | null
    author?:   { id: string; email: string }
    content:   string
    createdAt: string
}

export interface ForumPostWithComments extends ForumPost {
    column?: { id: string; name: Record<string, string>; section?: { id: string; name: Record<string, string> } }
    group?: { id: string; name: Record<string, string>; column?: { id: string; name: Record<string, string> } }
    comments: ForumComment[]
}

export interface ForumSection {
    id:          string
    name:        Record<string, string>
    description?: Record<string, string>
    icon:        string
    order:       number
    columns:     ForumColumn[]
    createdAt:   string
    updatedAt:   string
}

export interface ForumColumn {
    id:          string
    sectionId:   string
    name:        Record<string, string>
    description?: Record<string, string>
    order:       number
    groups:      ForumGroup[]
    _count?:     { posts: number }
}

export interface ForumGroup {
    id:          string
    columnId:    string
    name:        Record<string, string>
    description?: Record<string, string>
    order:       number
    _count?:     { posts: number }
}
