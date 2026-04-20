import { FACILITIES, MAX_ENERGY } from '../../../store/powerStore'
import { useTranslation } from 'react-i18next'

interface EnergyHUDProps {
    energy: number
}

export function EnergyHUD({ energy }: EnergyHUDProps) {
    const { t } = useTranslation()
    const pct = (energy / MAX_ENERGY) * 100

    const barColor =
        pct > 80
            ? 'from-sky-300 to-white'
            : pct > 40
                ? 'from-sky-500 to-sky-300'
                : 'from-sky-700 to-sky-500'

    return (
        <div
            className="absolute flex flex-col items-center gap-3 pointer-events-none select-none"
            style={{ right: '2rem', top: '50%', transform: 'translateY(-50%)' }}
        >
            {/* Label */}
            <span className="text-brand/70 text-[11px] tracking-[0.2em] uppercase font-mono">
                {t('lightning.powerLevel')}
            </span>

            {/* Bar track — vertical */}
            <div className="relative h-56 w-[6px] rounded-full bg-slate-800 border border-slate-700/60 overflow-hidden flex flex-col-reverse">
                {/* Fill — grows from bottom */}
                <div
                    className={`w-full rounded-full bg-gradient-to-t ${barColor} transition-all duration-200`}
                    style={{
                        height: `${pct}%`,
                        boxShadow: pct > 5 ? `0 0 ${Math.min(pct / 8, 10)}px #38bdf8` : 'none',
                    }}
                />
                {/* Threshold tick marks */}
                {FACILITIES.map((f) => (
                    <div
                        key={f.key}
                        className="absolute left-0 w-full h-px bg-slate-600/50"
                        style={{ bottom: `${f.threshold}%` }}
                    />
                ))}
            </div>

            {/* Percentage */}
            <span className="text-brand/70 text-[11px] font-mono">{Math.floor(pct)}%</span>

            {/* Facility dots */}
            <div className="flex flex-col gap-4 mt-2">
                {FACILITIES.map((f) => {
                    const active = energy >= f.threshold
                    return (
                        <div key={f.key} className="flex flex-col items-center gap-[3px]">
                            <div
                                className={`w-[7px] h-[7px] rounded-full transition-all duration-500 ${
                                    active
                                        ? 'bg-sky-400'
                                        : 'bg-slate-700'
                                }`}
                                style={active ? { boxShadow: '0 0 6px #38bdf8' } : undefined}
                            />
                            <span
                                className={`text-[9px] font-mono tracking-wide uppercase transition-colors duration-500 ${
                                    active ? 'text-brand/80' : 'text-slate-600'
                                }`}
                            >
                                {t(`nav.${f.key}`)}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
