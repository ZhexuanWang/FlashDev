import { create } from 'zustand'

interface SiteConfig {
    [key: string]: string
}

interface SiteStore {
    config: SiteConfig
    primary: string
    glow:    string
    setConfig: (config: SiteConfig) => void
    setTheme:  (primary: string, glow: string) => void
}

export const useSiteStore = create<SiteStore>((set) => ({
    config:  {},
    primary: '0ea5e9',
    glow:    '38bdf8',

    setConfig: (config) => set({ config }),

    setTheme: (primary, glow) => set({ primary, glow }),
}))
