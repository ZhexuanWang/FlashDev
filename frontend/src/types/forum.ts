export interface ForumPost {
    id:        string
    title:     string
    content:   unknown   // JSON content
    authorId:  string | null
    author?:   { id: string; email: string }
    tags:      string[]
    upvotes:   number
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
    group?: { id: string; name: Record<string, string>; section?: { id: string; name: Record<string, string> } }
    comments: ForumComment[]
}

export interface ForumSection {
    id:          string
    name:        Record<string, string>
    description?: Record<string, string>
    icon:        string
    order:       number
    groups:      ForumGroup[]
    createdAt:   string
    updatedAt:   string
}

export interface ForumGroup {
    id:          string
    sectionId:   string
    name:        Record<string, string>
    description?: Record<string, string>
    order:       number
    section?:    { id: string; name: Record<string, string> }
    createdAt:   string
    updatedAt:   string
    _count?:     { posts: number }
}
