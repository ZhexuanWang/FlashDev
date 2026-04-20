import { useEffect, useState } from 'react'
import { LightningMenu } from '../components/menu/lightning/LightningMenu'
// import { StarfieldMenu } from '../components/menu/starfield/StarfieldMenu'

type MenuMode = 'starfield' | 'lightning'

export default function HomePage() {
    const [menuMode, setMenuMode] = useState<MenuMode>('lightning')
    const [loading, setLoading]   = useState(true)

    useEffect(() => {
        fetch('/api/site-config/default_menu')
            .then((r) => r.json())
            .then((data: { value?: string }) => {
                if (data.value === 'starfield' || data.value === 'lightning') {
                    setMenuMode(data.value)
                }
            })
            .catch(() => {/* use default */})
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="w-full h-screen bg-black flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
            </div>
        )
    }

    if (menuMode === 'lightning') {
        return <LightningMenu />
    }

    // Starfield placeholder (Phase 10 component)
    return (
        <div className="w-full h-screen bg-black flex items-center justify-center text-sky-500 font-mono">
            Starfield Menu — Phase 10
        </div>
    )
}