import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useNavigate } from 'react-router-dom'
import {
    usePowerStore,
    FACILITIES,
    TICK_INTERVAL_MS,
} from '../../../store/powerStore'
import { PowerCore } from './PowerCore'
import { EnergyHUD } from './EnergyHUD'
import { Sidebar } from './Sidebar'
import { LanguageToggle } from './LanguageToggle'
import { StarBackground } from './StarBackground'
import { Asteroids } from './Asteroids'
import { PosterAreas } from './PosterAreas'
import { useTranslation } from 'react-i18next'

const RADIUS = 2.2
const CAMERA_Z = 9
const FOV = 55
const SCENE_OFFSET_X = 5.5  // shift whole scene right in world space

// Projects 3D positions pre-computed at module load
const NODES = FACILITIES.map((f, i) => {
    const angle = (i / FACILITIES.length) * Math.PI * 2 - Math.PI / 2
    return {
        ...f,
        pos: [Math.cos(angle) * RADIUS + SCENE_OFFSET_X, Math.sin(angle) * RADIUS, 0] as [number, number, number],
    }
})

// Converts 3D world position → screen percentage
function worldToScreen(
    pos: [number, number, number],
    width: number,
    height: number,
): { x: number; y: number } {
    const tan = Math.tan((FOV * Math.PI) / 180 / 2)
    const aspect = width / height
    const dx = (pos[0] / (CAMERA_Z * tan)) * 50 / aspect + 50
    const dy = -(pos[1] / (Math.abs(CAMERA_Z) * tan)) * 50 + 50
    return { x: dx, y: dy }
}

export function LightningMenu() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { energy, charge, decay } = usePowerStore()
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })

    useEffect(() => {
        timerRef.current = setInterval(() => decay(), TICK_INTERVAL_MS)
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [decay])

    useEffect(() => {
        const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden select-none">
            <Canvas
                camera={{ position: [0, 0, CAMERA_Z], fov: FOV }}
                gl={{ antialias: true, alpha: false }}
                style={{ position: 'absolute', inset: 0 }}
            >
                <color attach="background" args={['#000508']} />
                <ambientLight intensity={0.08} />
                <StarBackground />
                <group position={[SCENE_OFFSET_X, 0, 0]}>
                    <PowerCore energy={energy} onCharge={charge} />
                </group>
            </Canvas>

            {/* Asteroids — HTML overlay */}
            <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden">
                <Asteroids />
            </div>

            {/* Poster areas */}
            <PosterAreas />

            {/* HTML nav buttons — outside Canvas, uses real-time store reads */}
            <div className="absolute inset-0 z-20" style={{ pointerEvents: 'none' }}>
                {NODES.map((node) => {
                    const { x, y } = worldToScreen(node.pos, size.width, size.height)
                    const active = energy >= node.threshold
                    return (
                        <button
                            key={node.key}
                            onClick={() => {
                                if (usePowerStore.getState().energy >= node.threshold) {
                                    navigate(node.path)
                                }
                            }}
                            className="absolute"
                            style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                transform: 'translate(-50%, -50%)',
                                pointerEvents: 'auto',
                            }}
                        >
                            {/* Node visual */}
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                active
                                    ? 'border-sky-400 bg-sky-500/20 shadow-[0_0_12px_#38bdf8]'
                                    : 'border-slate-700 bg-transparent'
                            }`}>
                                {active && (
                                    <div className="w-3 h-3 rounded-full bg-sky-400 animate-pulse" />
                                )}
                            </div>
                            {/* Label */}
                            <div className={`mt-1 text-center font-mono text-[10px] tracking-widest transition-colors ${
                                active ? 'text-sky-300' : 'text-slate-600'
                            }`}>
                                {t(`nav.${node.key}`)}
                            </div>
                            {/* Threshold hint when inactive */}
                            {!active && (
                                <div className="text-[9px] text-slate-700 font-mono mt-0.5">
                                    {node.threshold}%
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            <EnergyHUD energy={energy} />

            {/* Left side overlays */}
            <div className="absolute left-0 top-0 h-full flex flex-col">
                <LanguageToggle />
                <Sidebar />
            </div>

            {energy < 8 && (
                <p className="absolute text-sky-500/50 text-sm tracking-widest font-mono animate-pulse pointer-events-none whitespace-nowrap z-30"
                   style={{ right: '2rem', top: 'calc(50% + 16rem + 1rem)' }}>
                    {t('lightning.clickToCharge')}
                </p>
            )}

            {energy >= 95 && (
                <p className="absolute text-sky-300/70 text-xs tracking-[0.3em] font-mono animate-pulse pointer-events-none z-30"
                   style={{ right: '2rem', top: 'calc(50% - 16rem - 2rem)' }}>
                    {t('lightning.fullPower')}
                </p>
            )}
        </div>
    )
}
