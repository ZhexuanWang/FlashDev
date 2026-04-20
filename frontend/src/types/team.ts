export interface TeamMember {
    id:        string
    name:      { zh: string; en: string }
    role:      { zh: string; en: string }
    bio:       { zh: string; en: string }
    avatar:    string
    github:    string
    order:     number
    isVisible: boolean
}