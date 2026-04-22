export type MarketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED'

export interface MarketPost {
    id:           string
    title:        string
    description:  string
    budget:       number | null
    timeline:     string | null
    contactEmail: string | null
    status:      MarketStatus
    posterId:     string | null
    poster?:      { id: string; email: string }
    tags:         string[]
    createdAt:    string
}
