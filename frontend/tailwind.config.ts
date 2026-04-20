import type { Config } from 'tailwindcss';

const config: {
    plugins: any[];
    theme: {
        extend: {
            keyframes: {
                powerPulse: {
                    "0%, 100%": { transform: string; opacity: string };
                    "50%": { transform: string; opacity: string }
                };
                planetFloat: { "0%, 100%": { transform: string }; "50%": { transform: string } };
                arcFlash: {
                    "100%": { transform: string; opacity: string };
                    "0%": { transform: string; opacity: string };
                    "50%": { transform: string; opacity: string }
                };
                facilityActivate: {
                    "100%": { filter: string; transform: string };
                    "0%": { filter: string; transform: string };
                    "60%": { filter: string; transform: string }
                }
            };
            fontFamily: { display: string[] };
            colors: {
                "bg-dark": string;
                "bg-card": string;
                success: string;
                "primary-glow": string;
                danger: string;
                accent: string;
                primary: string
            };
            animation: {
                "arc-flash": string;
                "planet-float": string;
                "facility-activate": string;
                "power-pulse": string
            }
        }
    };
    darkMode: string;
    content: string[]
} = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: 'var(--primary)',
                'primary-glow': 'var(--primary-glow)',
                accent: 'var(--accent)',
                'bg-dark': 'var(--bg-dark)',
                'bg-card': 'var(--bg-card)',
                danger: 'var(--danger)',
                success: 'var(--success)',
            },
            fontFamily: {
                display: ['Space Grotesk', 'sans-serif'],
            },
            animation: {
                'power-pulse': 'powerPulse 1.5s ease-in-out infinite',
                'arc-flash': 'arcFlash 0.3s ease-out',
                'facility-activate': 'facilityActivate 0.5s ease-out forwards',
                'planet-float': 'planetFloat 6s ease-in-out infinite',
            },
            keyframes: {
                powerPulse: {
                    '0%, 100%': {opacity: '0.6', transform: 'scale(1)'},
                    '50%': {opacity: '1', transform: 'scale(1.05)'},
                },
                arcFlash: {
                    '0%': {opacity: '0', transform: 'scaleX(0)'},
                    '50%': {opacity: '1', transform: 'scaleX(1.2)'},
                    '100%': {opacity: '0', transform: 'scaleX(0)'},
                },
                facilityActivate: {
                    '0%': {filter: 'brightness(0.3) saturate(0)', transform: 'scale(1)'},
                    '60%': {filter: 'brightness(2) saturate(2)', transform: 'scale(1.1)'},
                    '100%': {filter: 'brightness(1) saturate(1.5)', transform: 'scale(1)'},
                },
                planetFloat: {
                    '0%, 100%': {transform: 'translateY(0px) rotate(0deg)'},
                    '50%': {transform: 'translateY(-20px) rotate(5deg)'},
                },
            },
        },
    },
    plugins: [],
};

export default config;