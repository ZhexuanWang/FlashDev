import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useSiteStore } from '../store/siteStore'
import { applyTheme } from '../hooks/useTheme'

export function ThemeEditor() {
    const role  = useAuthStore(state => state.role)
    const token = useAuthStore(state => state.token)
    const storePrimary = useSiteStore(state => state.primary)
    const storeGlow    = useSiteStore(state => state.glow)
    const setTheme     = useSiteStore(state => state.setTheme)

    const [primary, setPrimary] = useState(storePrimary)
    const [glow,    setGlow]    = useState(storeGlow)
    const [saving,  setSaving]  = useState(false)
    const [saved,   setSaved]   = useState(false)

    if (role !== 'COMPANY') return null

    const handleChange = (key: 'primary' | 'glow', hex: string) => {
        const clean = hex.replace('#', '')
        if (key === 'primary') {
            setPrimary(clean)
            applyTheme(clean, glow)
        } else {
            setGlow(clean)
            applyTheme(primary, clean)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setSaved(false)
        try {
            await Promise.all([
                fetch('/api/site-config/theme.primary', {
                    method:  'PUT',
                    headers: {
                        'Content-Type':  'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ value: primary }),
                }),
                fetch('/api/site-config/theme.glow', {
                    method:  'PUT',
                    headers: {
                        'Content-Type':  'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ value: glow }),
                }),
            ])
            setTheme(primary, glow)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-800 bg-slate-950/60">
            <span className="text-slate-600 font-mono text-[10px] tracking-widest">THEME</span>

            {/* Primary 色 */}
            <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-slate-500 font-mono text-[10px]">Primary</span>
                <input
                    type="color"
                    value={`#${primary}`}
                    onChange={e => handleChange('primary', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
            </label>

            {/* Glow 色 */}
            <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-slate-500 font-mono text-[10px]">Glow</span>
                <input
                    type="color"
                    value={`#${glow}`}
                    onChange={e => handleChange('glow', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
            </label>

            {/* 保存按钮 */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="ml-2 px-3 py-1 border border-slate-700 text-slate-400 font-mono text-[10px]
                           rounded hover:border-sky-700 hover:text-brand transition-all
                           disabled:opacity-40"
            >
                {saving ? '保存中...' : saved ? '✓ 已保存' : '保存主题'}
            </button>
        </div>
    )
}