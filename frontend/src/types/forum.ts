export interface ForumPost {
    id:        string
    title:     string
    content:   unknown   // JSON content
    authorId:  string | null
    author?:   { id: string; email: string }
    tags:      string[]
    upvotes:   number
    createdAt: string
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
    comments: ForumComment[]
}
