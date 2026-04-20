import { create } from 'zustand'

export const MAX_ENERGY = 100
export const CHARGE_PER_CLICK = 12
export const DECAY_PER_TICK = 0.15   // per 100ms (~1.5 energy/sec)
export const TICK_INTERVAL_MS = 100

export const FACILITIES = [
    { key: 'projects', label: 'Projects', threshold: 20, path: '/projects'  },
    { key: 'services', label: 'Services', threshold: 40, path: '/services'  },
    { key: 'team',     label: 'Team',     threshold: 60, path: '/team'      },
    { key: 'contact',  label: 'Contact',  threshold: 80, path: '/contact'   },
] as const

export type FacilityKey = (typeof FACILITIES)[number]['key']

interface PowerState {
    energy: number
    isCharging: boolean
    charge: () => void
    decay:  () => void
    reset:  () => void
}

export const usePowerStore = create<PowerState>((set) => ({
    energy: 0,
    isCharging: false,

    charge: () =>
        set((s) => ({
            energy: Math.min(MAX_ENERGY, s.energy + CHARGE_PER_CLICK),
            isCharging: true,
        })),

    decay: () =>
        set((s) => ({
            energy: Math.max(0, s.energy - DECAY_PER_TICK),
            isCharging: false,
        })),

    reset: () => set({ energy: 0, isCharging: false }),
}))
