import { useEffect } from 'react'
import { useSiteStore } from '../store/siteStore'

function applyTheme(primary: string, glow: string) {
    const root = document.documentElement
    const p = primary.replace('#', '')
    const g = glow.replace('#', '')
    root.style.setProperty('--color-primary',        `#${p}`)
    root.style.setProperty('--color-glow',           `#${g}`)
    root.style.setProperty('--color-brand',           `#${p}`)
    root.style.setProperty('--color-brand-glow',      `#${g}`)
}

export function useTheme() {
    const setConfig = useSiteStore(s => s.setConfig)
    const setTheme  = useSiteStore(s => s.setTheme)

    useEffect(() => {
        fetch('/api/site-config')
            .then(r => r.json())
            .then((configs: Record<string, string>) => {
                const primary = configs['theme.primary'] ?? '0ea5e9'
                const glow    = configs['theme.glow']    ?? '38bdf8'
                setConfig(configs)
                setTheme(primary, glow)
                applyTheme(primary, glow)
            })
            .catch(() => {})
    }, [setConfig, setTheme])
}

export { applyTheme }